pub mod api;
pub mod routes;
pub mod models;

#[macro_use]
extern crate rocket;

use rocket::data::FromData;
use rocket::fairing::{AdHoc, Fairing, Info, Kind};
use rocket::http::hyper::request;
use rocket::outcome::Outcome;
use rocket::request::FromRequest;
use rocket::{Build, Config, fairing, Request, Response, Rocket, tokio};
use rocket::http::{Header, Status};
use crate::models::Db;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use std::{env, fs};

use rocket::fs::{FileServer, NamedFile};


#[path="data-merges/mod.rs"]
pub mod data_merges;


#[derive(Debug, Clone)]
pub enum FrontendPort {
    Same,
    Https,
    Custom(u16),
}

pub static FRONTEND_PORT: OnceLock<FrontendPort> = OnceLock::new();

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _request: &'r Request<'_>, response: &mut Response<'r>) {
        let request_origin = _request.headers().get_one("Origin");

        debug!("> CORS: request_origin: {:?}", request_origin);

        if request_origin.is_none() {
            return;
        }

        let allowed_origins = ["https://localhost", "https://212.118.37.143"];

        allowed_origins
            .iter()
            .map(|&origin| {
                response.set_header(Header::new("Access-Control-Allow-Origin", origin));
                response.set_header(Header::new(
                    "Access-Control-Allow-Methods",
                    "POST, GET, PATCH, OPTIONS",
                ));
                response.set_header(Header::new("Access-Control-Allow-Headers", "Content-Type"));
                response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
                Some(origin)
            })
            .next();
    }
}

pub struct DocumentRequest;

#[async_trait]
impl<'r> FromRequest<'r> for DocumentRequest {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> rocket::request::Outcome<Self, Self::Error> { 
        let path = req.uri().path();
        // info!("{}", path);
        if path == "/" {
            return rocket::request::Outcome::Forward(());
        }
        let fir_seg = path.segments().next().unwrap();
        if fir_seg == "static" {
            return rocket::request::Outcome::Forward(());
        }
        if fir_seg.find('.').is_some() {
            return rocket::request::Outcome::Forward(());
        }
        rocket::request::Outcome::Success(DocumentRequest)
    }
}

#[get("/<path..>", rank=5)]
async fn frontend_page(path: PathBuf, document: DocumentRequest) -> Option<NamedFile> {
    let mut path = PathBuf::from("../client/build");
    path.push("index.html");
    NamedFile::open(path).await.ok()
}

pub fn stage() -> AdHoc {
    AdHoc::on_ignite("SQLx Stage", |rocket| async {
        let mut routes = routes::get_api_routes();
        routes.append(&mut routes![options_handler]);
        rocket
            .attach(Db::init())
            .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
            .mount("/api", routes)
            .mount("/", routes![frontend_page])
    })
}


use chrono::Local;
use colored::*;
use rand::Rng;
use rocket::response::{Responder, Redirect};
use rocket_db_pools::Database;
use sqlx::SqlitePool;
use crate::api::vk_api::VK_SERVICE_TOKEN;


fn loglevel_formatter(level: &log::Level) -> ColoredString {
    match level {
        log::Level::Error => level.to_string().bright_white().on_red().bold(),
        log::Level::Warn => level.to_string().yellow().bold(),
        log::Level::Info => level.to_string().green(),
        log::Level::Debug => level.to_string().blue(),
        log::Level::Trace => level.to_string().dimmed(),
    }
}

fn setup_logger() -> Result<(), fern::InitError> {
    fern::Dispatch::new()
        .format(|out, message, record| {
            out.finish(format_args!(
                "[{} {}] {}",
                Local::now()
                    .format("%Y-%m-%d %H:%M:%S")
                    .to_string()
                    .bright_purple(),
                loglevel_formatter(&record.level()),
                message
            ))
        })
        .level(log::LevelFilter::Trace)
        .chain(std::io::stdout())
        .chain(fern::log_file("output.log")?)
        .apply()?;
    Ok(())
}


async fn run_migrations(rocket: Rocket<Build>) -> fairing::Result {
    match Db::fetch(&rocket) {
        Some(db) => match sqlx::migrate!("./migrations").run(&**db).await {
            Ok(_) => Ok(rocket),
            Err(e) => {
                error!("Failed to initialize SQLx database: {}", e);
                Err(rocket)
            }
        },
        None => Err(rocket),
    }
}


pub fn run() -> Rocket<Build> {

    setup_logger().unwrap();
    let args: Vec<String> = env::args().collect();
    let mut figment = rocket::Config::figment();

    let rocket_config: Config = figment.extract().unwrap();

    info!("ROCKET CONFIG:");
    info!("> is custom profile: {}", rocket_config.profile.is_custom());
    info!("> profile: {}", rocket_config.profile);
    let is_production_build = rocket_config.profile.is_custom() && rocket_config.profile == "prod";
    if is_production_build {
        // running profile prod
        FRONTEND_PORT.set(FrontendPort::Same).unwrap();
        info!("> running profile prod");
    } else {
        // dev server, port is different
        FRONTEND_PORT.set(FrontendPort::Https).unwrap();
        info!("> running profile dev");
    }

    // check vk service key
    match fs::read_to_string("vk_service_token.txt") {
        Ok(key) => {
            debug!("> VK: service key found");
            VK_SERVICE_TOKEN
                .set(Arc::try_from(key.trim()).unwrap())
                .unwrap();
        }
        Err(_) => {
            error!(
                "No vk service key found! Create vk_service_token.txt file with service key inside"
            );
            std::process::exit(1);
        }
    }

    match fs::read_to_string("secret_key.txt") {
        Ok(key) => {
            debug!("> Secret key found");
            figment = figment.merge(("secret_key", key));
        }
        Err(_) => {
            warn!("No secret key found, generating one");

            let mut rng = rand::thread_rng();
            let key: [u8; 32] = rng.gen();
            base64::encode(&key);

            fs::write("secret_key.txt", &key).unwrap();
            figment = figment.merge(("secret_key", key));
        }
    }

    let with_client = args.contains(&"--with-client".to_string());
    info!("> with client: {}", with_client);
    let mut rocket = rocket::custom(figment)
        .attach(stage());

    if !is_production_build {
        rocket = rocket.attach(CORS);
    }

    // let pool = tokio::block_on(async {SqlitePool::connect("sqlite::memory:").await.unwrap()});

    // Launch periodic task after Rocket ignition but before blocking on Rocket's server
    // let db_ref = rocket.state::<Db>().unwrap().clone();
    // tokio::spawn(periodic_task(db_ref));

    if with_client {
        rocket
            .mount("/", FileServer::from("../client/build"))
    } else {
        rocket
    }
}

async fn periodic_task(pool: &SqlitePool) {
    // For demonstration, use a loop with a delay
    loop {
        info!("Running periodic task!");

        let groups_count: u32 = sqlx::query_scalar("SELECT COUNT(*) FROM groups")
            .fetch_one(pool)
            .await
            .unwrap();

        info!("Groups count: {}", groups_count);

        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await

    }
}

#[options("/<_path..>")]
fn options_handler<'r>(_path: Option<PathBuf>) -> impl Responder<'r, 'static> {
    Status::Ok
}
