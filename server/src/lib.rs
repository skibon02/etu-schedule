#![feature(try_trait_v2)]

pub mod api;
pub mod routes;
pub mod models;
pub mod bg_workers;

#[macro_use]
extern crate rocket;

use rocket::data::FromData;
use rocket::fairing::{AdHoc, Fairing, Info, Kind};
use rocket::http::hyper::request;
use rocket::outcome::Outcome;
use rocket::request::FromRequest;
use rocket::{Build, Config, Data, fairing, Request, Response, Rocket, tokio};
use rocket::http::{Header, Status};
use crate::models::Db;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use std::{env, fs};
use std::collections::BTreeMap;
use std::fmt::Arguments;
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::atomic::AtomicUsize;
use std::time::Instant;

use rocket::fs::{FileServer, NamedFile};


#[path="data-merges/mod.rs"]
pub mod data_merges;

const LOGGING_LEVEL: LevelFilter = LevelFilter::Info;

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

        trace!("> CORS: request_origin: {:?}", request_origin);

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
            return Outcome::Forward(Status::NotFound);
        }
        let fir_seg = path.segments().next().unwrap();
        if fir_seg == "static" {
            return Outcome::Forward(Status::NotFound);
        }
        if fir_seg.find('.').is_some() {
            return Outcome::Forward(Status::NotFound);
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

pub fn bg_worker(shutdown_notifier: Arc<Notify>) -> AdHoc {
    let notifier_r1 = shutdown_notifier.clone();
    let notifier_r2 = shutdown_notifier.clone();
    let notifier_r3 = shutdown_notifier.clone();
    AdHoc::on_liftoff("Background Worker", |rocket| Box::pin(async {
        // Launch periodic task after Rocket ignition but before blocking on Rocket's server
        let db = rocket.state::<Db>().unwrap();
        let mut db_con1 = db.acquire().await.unwrap();
        let mut db_con2 = db.acquire().await.unwrap();
        let mut db_con3 = db.acquire().await.unwrap();
        tokio::task::spawn(async move {
            bg_workers::periodic_schedule_merge_task(&mut db_con1, notifier_r1).await;
        });
        tokio::task::spawn(async move {
            bg_workers::priority_schedule_merge_task(&mut db_con2, notifier_r2).await;
        });
        tokio::task::spawn(async move {
            bg_workers::attendance_worker_task(&mut db_con3, notifier_r3).await;
        });
    }))
}

use chrono::Local;
use colored::*;
use fern::{Dispatch, FormatCallback};
use lazy_static::lazy_static;
use log::{LevelFilter, Record};
use rand::Rng;
use rocket::response::Responder;
use rocket_db_pools::Database;
use sqlx::PgConnection;
use tokio::select;
use regex::Regex;
use tokio::sync::Notify;
use crate::api::etu_api;
use crate::api::vk_api::VK_SERVICE_TOKEN;
use crate::models::groups::{DepartmentModel, get_not_merged_sched_group_id_list};
use crate::models::schedule::{ScheduleObjModel};
use crate::models::subjects::{get_subjects_cur_gen, SubjectModel};
use crate::models::teachers::{get_teachers_cur_gen, TeacherModel};


fn loglevel_formatter(level: &log::Level) -> ColoredString {
    match level {
        log::Level::Error => level.to_string().bright_white().on_red().bold(),
        log::Level::Warn => level.to_string().yellow().bold(),
        log::Level::Info => level.to_string().green(),
        log::Level::Debug => level.to_string().blue(),
        log::Level::Trace => level.to_string().dimmed(),
    }
}


fn strip_colors(message: String) -> String {
    let re = Regex::new("\x1B\\[[;\\d]*m").unwrap();
    re.replace_all(&message, "").to_string()
}

fn setup_logger() -> Result<(), fern::InitError> {
    let console_log = Dispatch::new()
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
        .level(LOGGING_LEVEL)
        .chain(std::io::stdout());

    let file_formatter = |out: FormatCallback, message: &Arguments, record: &Record| {
        out.finish(format_args!(
            "[{} {}] {}",
            Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            &record.level(),
            &strip_colors(message.to_string())
        ))
    };

    let debug_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Debug)
        .chain(fern::log_file("output_debug.log")?);

    let info_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Info)
        .chain(fern::log_file("output_info.log")?);

    let warn_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Warn)
        .chain(fern::log_file("output_warn.log")?);

    let combined_log = Dispatch::new()
        .chain(console_log)
        .chain(debug_file_log)
        .chain(info_file_log)
        .chain(warn_file_log)
        .apply()?;

    Ok(())
}

use std::panic;
use std::fs::File;
use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref PANIC_LOG_FILE: Mutex<File> = Mutex::new(File::create("panics.log").unwrap());
}

fn setup_panic_logger() {
    panic::set_hook(Box::new(|panic_info| {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let message = match panic_info.payload().downcast_ref::<&str>() {
            Some(s) => *s,
            None => match panic_info.payload().downcast_ref::<String>() {
                Some(s) => &s[..],
                None => "Panic occurred but no message available.",
            },
        };

        let location = panic_info.location().unwrap();
        let panic_message = format!("{}: Panic occurred in file '{}' at line {}: {}\n", timestamp, location.file(), location.line(), message);

        // Write the panic message to the log file
        let mut file = PANIC_LOG_FILE.lock().unwrap();
        writeln!(file, "{}", panic_message).unwrap();

        // Additionally, you might want to print the panic message to stderr
        eprintln!("{}", panic_message);
    }));
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
    setup_panic_logger();

    // panic!("let's test this shit!");

    let args: Vec<String> = env::args().collect();
    let mut figment = rocket::Config::figment();

    figment = figment.merge(("databases.postgres", rocket_db_pools::Config {
        url: "postgres://etu_attend_app:12346543@localhost".into(),
        max_connections: 150,
        min_connections: None,
        connect_timeout: 3,
        idle_timeout: Some(120)
    }));

    let rocket_config: Config = figment.extract().unwrap();

    info!("ROCKET CONFIG:");
    info!("{:#?}", rocket_config);
    let profile = env::var("ROCKET_PROFILE").unwrap_or("default".into());
    info!("> profile: {}", profile);
    let is_production_build = profile == "production";
    if is_production_build {
        // running profile prod
        FRONTEND_PORT.set(FrontendPort::Same).unwrap();
        info!("> running production profile");
    } else {
        // dev server, port is different
        FRONTEND_PORT.set(FrontendPort::Https).unwrap();
        info!("> running development profile");
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

    let shutdown_notify = Arc::new(Notify::new());

    let with_client = args.contains(&"--with-client".to_string());
    info!("> with client: {}", with_client);
    let mut rocket = rocket::custom(figment)
        .attach(stage())
        .attach(bg_worker(shutdown_notify.clone()))
        .attach(AdHoc::on_shutdown("Notify shutdown", |_rocket|  Box::pin(async move {
            shutdown_notify.notify_waiters();
        })));

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

#[options("/<_path..>")]
fn options_handler<'r>(_path: Option<PathBuf>) -> impl Responder<'r, 'static> {
    Status::Ok
}
