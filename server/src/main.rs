use std::sync::{OnceLock, Arc};
use std::{fs, env};

use rocket::{Rocket, Build, futures, Config};
use rocket::fairing::{self, AdHoc};

use rocket_db_pools::{sqlx, Database, Connection};

use rocket::fs::FileServer;

pub mod etu_api;
pub mod vk_api;

pub mod routes;

#[macro_use]
extern crate rocket;

#[derive(Database)]
#[database("sqlx")]
struct Db(sqlx::SqlitePool);

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

use rocket::http::Status;
use rocket::response::Responder;

#[options("/<path..>")]
fn options_handler<'r>(path: Option<std::path::PathBuf>) -> impl Responder<'r, 'static> {
    Status::Ok
}

async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match Db::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("./migrations").run(&**db).await {
            Ok(_) => Ok(rocket),
            Err(e) => {
                error!("Failed to initialize SQLx database: {}", e);
                Err(rocket)
            }
        }
        None => Err(rocket),
    }
}

use rocket::http::Header;
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        let request_origin = _request.headers().get_one("Origin");

        println!("request_origin: {:?}", request_origin);

        if request_origin.is_none() {
            return;
        }

        let allowed_origins = ["https://localhost", "https://212.118.37.143"];

        allowed_origins.iter().map(|origin| {
            response.set_header(Header::new("Access-Control-Allow-Origin", origin.clone()));
            response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
            response.set_header(Header::new("Access-Control-Allow-Headers", "Content-Type"));
            response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
            Some(origin)
        }).next();
    }
}

use rand::Rng;
use vk_api::VK_SERVICE_TOKEN;

#[derive(Debug, Clone)]
enum FrontendPort {
    Same,
    Https,
    Custom(u16),
}

static FRONTEND_PORT: OnceLock<FrontendPort> = OnceLock::new();

#[launch]
async fn rocket() -> _ {
    let args: Vec<String> = env::args().collect();
    let mut figment = rocket::Config::figment();

    let rocket_config: Config = figment.extract().unwrap();

    let isProductionBuild = rocket_config.profile.is_custom() && rocket_config.profile == "prod";
    if isProductionBuild {
        // running profile prod
        FRONTEND_PORT.set(FrontendPort::Same).unwrap();
    }
    else {
        // dev server, port is different
        FRONTEND_PORT.set(FrontendPort::Https).unwrap();
    }

    // check vk service key
    match fs::read_to_string("vk_service_token.txt") {
        Ok(key) => {
            debug!(" > VK: service key found");
            VK_SERVICE_TOKEN.set(Arc::try_from(key).unwrap()).unwrap();
        }
        Err(_) => {
            error!("No vk service key found! Create vk_service_token.txt file with service key inside");
            std::process::exit(1);
        }
    }

    match fs::read_to_string("secret_key.txt") {
        Ok(key) => {
            figment = figment.merge(("secret_key", key));
        }
        Err(_) => {
            println!("No secret key found, generating one");
            let key = rocket::tokio::time::timeout(
                std::time::Duration::from_secs(5),
                rocket::tokio::task::spawn_blocking(|| {
                    let mut rng = rand::thread_rng();
                    let key: [u8; 32] = rng.gen();
                    base64::encode(&key)
                }),
            )
            .await
            .unwrap()
            .unwrap();
            fs::write("secret_key.txt", &key).unwrap();
            figment = figment.merge(("secret_key", key));
        }
    }

    let with_client = args.contains(&"--with-client".to_string());
    let mut rocket = rocket::custom(figment)
        .attach(stage());

    if !isProductionBuild {
        rocket = rocket.attach(CORS);
    }

    if with_client {
        rocket.mount("/", FileServer::from("../client/build"))
    }
    else {
        rocket
    }
}



pub fn stage() -> AdHoc {
    AdHoc::on_ignite("SQLx Stage", |rocket| async {

        let mut routes = routes::get_api_routes();
        routes.append(&mut routes![options_handler]);
        rocket.attach(Db::init())
            .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
            .mount("/api", routes)
    })
}
