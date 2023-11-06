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
use std::collections::BTreeMap;
use std::time::Instant;

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
            return Outcome::Forward(());
        }
        let fir_seg = path.segments().next().unwrap();
        if fir_seg == "static" {
            return Outcome::Forward(());
        }
        if fir_seg.find('.').is_some() {
            return Outcome::Forward(());
        }
        Outcome::Success(DocumentRequest)
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

pub fn bg_worker() -> AdHoc {
    AdHoc::on_liftoff("Background Worker", |rocket| Box::pin(async {
        // Launch periodic task after Rocket ignition but before blocking on Rocket's server
        let db_ref = rocket.state::<Db>().unwrap().clone();
        tokio::task::spawn(async move {
            periodic_task(db_ref).await;
        });
    }))
}

use chrono::Local;
use colored::*;
use lazy_static::lazy_static;
use rand::Rng;
use rocket::response::{Responder, Redirect};
use rocket_db_pools::{Connection, Database};
use sqlx::{Pool, Sqlite, SqlitePool};
use tokio::select;
use crate::api::etu_api;
use crate::api::vk_api::VK_SERVICE_TOKEN;
use crate::models::groups::DepartmentModel;
use crate::models::schedule::{ScheduleObjModel, SubjectModel};


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
        .attach(stage())
        .attach(bg_worker());

    if !is_production_build {
        rocket = rocket.attach(CORS);
    }

    // let pool = tokio::block_on(async {SqlitePool::connect("sqlite::memory:").await.unwrap()});


    if with_client {
        rocket
            .mount("/", FileServer::from("../client/build"))
    } else {
        rocket
    }
}
pub static MERGE_REQUEST_CHANNEL: OnceLock<tokio::sync::mpsc::Sender<u32>> = OnceLock::new();

const GROUPS_MERGE_INTERVAL: u64 = 60*10;
const ETU_REQUEST_INTERVAL: u64 = 5;

async fn periodic_task(mut con: Db) {
    // For demonstration, use a loop with a delay
    let (tx, mut rx) = tokio::sync::mpsc::channel(50);
    MERGE_REQUEST_CHANNEL.set(tx).unwrap();



    let new_groups = etu_api::get_groups_list().await;
    data_merges::groups::groups_merge(&new_groups, &mut con.acquire().await.unwrap()).await.unwrap();

    let mut last_etu_request = Instant::now() - tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL);

    loop {
        let mut group_request = None;

        select! {
            _ = tokio::time::sleep(tokio::time::Duration::from_secs(60*10)) => {
                info!("BGTASK: 10 minutes passed, starting merge routine...");
            },
            Some(request) = rx.recv() => {
                info!("BGTASK: Got request for merging {} group", request);

                let time = models::groups::get_time_since_last_group_merge(request, &mut con.acquire().await.unwrap()).await;
                match time {
                    Ok(time) => {
                        match time {
                            Some(time) => {
                                if time < 30 {
                                    warn!("BGTASK: Last merge for group {} was {} seconds ago, skipping...", request, time);
                                    continue;
                                }
                            },
                            None => {
                                warn!("BGTASK: Group schedule was never requested! Launching merge...");
                            }
                        }
                    },
                    Err(_) => {
                        error!("BGTASK: Non-existing group merge requested!");
                        continue;
                    }
                }

                group_request = Some(request);
            }
        }
        if Instant::now() - last_etu_request < tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) {
            warn!("BGTASK: Last ETU request was {} seconds ago, waiting...", (Instant::now() - last_etu_request).as_secs());
            tokio::time::sleep(tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) - (Instant::now() - last_etu_request)).await;
        }

        info!("BGTASK: Starting default background mering routime...");
        let new_groups = etu_api::get_groups_list().await;
        data_merges::groups::groups_merge(&new_groups, &mut con.acquire().await.unwrap()).await.unwrap();


        let group_id = match group_request {
            Some(id) => id,
            None => {
                models::groups::get_oldest_group_id(&mut con).await.unwrap_or(0)
            }
        };
        let sched_objs = etu_api::get_schedule_objs_group(group_id).await.unwrap();
        let mut sched_objs_models: Vec<ScheduleObjModel> = Vec::new();
        let mut subjects: BTreeMap<u32, SubjectModel> = BTreeMap::new();
        let mut departments: Vec<DepartmentModel> = Vec::new();
        for sched_obj_orig in sched_objs.scheduleObjects {
            sched_objs_models.append(&mut sched_obj_orig.clone().into());
            subjects.insert(sched_obj_orig.lesson.subject.id, sched_obj_orig.lesson.subject.clone().into());
            departments.push(sched_obj_orig.lesson.subject.department.into());
        }
        for department in departments {
            data_merges::groups::department_single_merge(department, None, &mut con.acquire().await.unwrap()).await.unwrap();
        }
        data_merges::subjects::subjects_merge(&subjects, &mut con.acquire().await.unwrap()).await.unwrap();
        data_merges::schedule::schedule_objs_merge(group_id, &sched_objs_models, &mut con.acquire().await.unwrap()).await.unwrap();

        last_etu_request = Instant::now();


    }
}

#[options("/<_path..>")]
fn options_handler<'r>(_path: Option<PathBuf>) -> impl Responder<'r, 'static> {
    Status::Ok
}
