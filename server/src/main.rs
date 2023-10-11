use std::env;

use rocket::{Rocket, Build, futures};
use rocket::fairing::{self, AdHoc};
use rocket::response::status::Created;
use rocket::serde::{Serialize, Deserialize, json::Json};

use rocket_db_pools::{sqlx, Database, Connection};

use futures::{stream::TryStreamExt, future::TryFutureExt};

use rocket::fs::FileServer;


#[macro_use]
extern crate rocket;

#[derive(Database)]
#[database("sqlx")]
struct Db(sqlx::SqlitePool);

type Result<T, E = rocket::response::Debug<sqlx::Error>> = std::result::Result<T, E>;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
struct Post {
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    id: Option<i64>,
    title: String,
    text: String,
}

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
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

#[launch]
fn rocket() -> _ {


    let args: Vec<String> = env::args().collect();

    let with_client = args.contains(&"--with-client".to_string());
    let rocket = rocket::build()
        .attach(stage())
        .attach(CORS);

    if with_client {
        rocket.mount("/", FileServer::from("../client/build"))
    }
    else {
        rocket
    }
}



pub fn stage() -> AdHoc {
    AdHoc::on_ignite("SQLx Stage", |rocket| async {
        rocket.attach(Db::init())
            .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
            .mount("/api", routes![
            options_handler])
    })
}
