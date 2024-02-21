#![feature(try_trait_v2)]

pub mod api;
pub mod bg_workers;
pub mod models;
pub mod routes;

#[macro_use]
extern crate rocket;

use crate::models::Db;
use rocket::fairing::{AdHoc, Fairing, Info, Kind};
use rocket::http::{Header, Status};
use rocket::outcome::Outcome;
use rocket::request::FromRequest;
use rocket::{fairing, tokio, Build, Config, Request, Response, Rocket};
use std::fmt::Arguments;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use std::{env, fs};

use rocket::fs::{FileServer, NamedFile};

#[path = "data-merges/mod.rs"]
pub mod data_merges;
pub mod diagnostics;

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

        let allowed_origins = [
            "https://localhost",
            "https://77.246.107.64/",
            "https://etu-schedule.ru/",
        ];

        allowed_origins
            .iter()
            .map(|&origin| {
                response.set_header(Header::new("Access-Control-Allow-Origin", origin));
                response.set_header(Header::new(
                    "Access-Control-Allow-Methods",
                    "POST, GET, PATCH, OPTIONS, DELETE, PUT",
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
        let Some(fir_seg) = path.segments().next() else {
            return Outcome::Forward(Status::NotFound);
        };
        if fir_seg == "static" {
            return Outcome::Forward(Status::NotFound);
        }
        if fir_seg.find('.').is_some() {
            return Outcome::Forward(Status::NotFound);
        }
        Outcome::Success(DocumentRequest)
    }
}

static FRONTEND_ROUTES: &[&str] = &["schedule", "planning", "profile"];

#[get("/<path..>", rank = 5)]
async fn frontend_page(path: PathBuf, _document: DocumentRequest) -> Option<NamedFile> {
    info!("> frontend_page: {:?}", path);
    // whitelist
    if !FRONTEND_ROUTES.contains(&path.to_str().unwrap()) {
        return None;
    }

    let mut path = PathBuf::from("../tsclient/build");
    path.push("index.html");
    NamedFile::open(path).await.ok()
}

pub fn bg_worker(shutdown_notifier: watch::Receiver<bool>) -> AdHoc {
    let notifier_r1 = shutdown_notifier.clone();
    let notifier_r2 = shutdown_notifier.clone();
    let notifier_r3 = shutdown_notifier.clone();
    AdHoc::on_liftoff("Background Worker", |rocket| {
        Box::pin(async {
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
        })
    })
}

use chrono::Local;
use colored::*;
use fern::{Dispatch, FormatCallback};

use crate::api::vk_api::VK_SERVICE_TOKEN;
use log::{LevelFilter, Record};
use rand::Rng;
use regex::Regex;
use rocket::response::Responder;
use rocket_db_pools::Database;
use tokio::sync::watch;

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

fn logger_folder_name() -> String {
    let cur_date = Local::now().format("%Y-%m-%d").to_string();
    format!("logs/{}", cur_date).to_string()
}

fn setup_logger() -> Result<(), fern::InitError> {
    let folder_name = logger_folder_name();
    if fs::create_dir_all(&folder_name).is_err() {
        warn!("Failed to create log folder: {}", folder_name);
    }

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
        .chain(fern::log_file(folder_name.clone() + "/output_debug.log")?);

    let info_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Info)
        .chain(fern::log_file(folder_name.clone() + "/output_info.log")?);

    let warn_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Warn)
        .chain(fern::log_file(folder_name.clone() + "/output_warn.log")?);

    let error_file_log = fern::Dispatch::new()
        .format(file_formatter)
        .level(LevelFilter::Error)
        .chain(fern::log_file(folder_name + "/output_error.log")?);

    let notify_callback = |out: FormatCallback, message: &Arguments, record: &Record| {
        let message = format!(
            "[{} {}] {}",
            Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            &record.level(),
            &strip_colors(message.to_string())
        );
        diagnostics::notify_important_event(diagnostics::EventType::ErrorMessage, &message);
        out.finish(format_args!("{}", message))
    };
    let null_filename = if cfg!(windows) { "nul" } else { "/dev/null" };
    let error_log_notifier = fern::Dispatch::new()
        .format(notify_callback)
        .level(LevelFilter::Error)
        .chain(fern::log_file(null_filename)?);

    Dispatch::new()
        .chain(console_log)
        .chain(debug_file_log)
        .chain(info_file_log)
        .chain(warn_file_log)
        .chain(error_file_log)
        .chain(error_log_notifier)
        .apply()?;

    Ok(())
}

use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use rocket::serde::json::json;
use rocket::shield::{Hsts, Shield};
use std::fs::{File, OpenOptions};
use std::panic;
use std::sync::Mutex;

pub fn create_folder_and_open_file(folder: String, file: String) -> File {
    if fs::create_dir_all(&folder).is_err() {
        warn!("Failed to create log folder: {}", folder);
    }

    OpenOptions::new()
        .append(true)
        .create(true)
        .open(format!("{}/{}", folder, file))
        .unwrap()
}

lazy_static::lazy_static! {
    static ref PANIC_LOG_FILE: Mutex<File> = Mutex::new(create_folder_and_open_file(logger_folder_name(), "panics.log".to_string()));
    static ref IP_LOG_FILE: Mutex<File> = Mutex::new(create_folder_and_open_file(logger_folder_name(), "ip.log".to_string()));
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
        let panic_message = format!(
            "{}: Panic occurred in file '{}' at line {}: {}\n",
            timestamp,
            location.file(),
            location.line(),
            message
        );

        // Write the panic message to the log file
        let mut file = PANIC_LOG_FILE.lock().unwrap();
        writeln!(file, "{}", panic_message).unwrap();

        diagnostics::notify_important_event(diagnostics::EventType::PanicMessage, &panic_message);
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

    figment = figment.merge((
        "databases.postgres",
        rocket_db_pools::Config {
            url: "postgres://etu_attend_app:12346543@localhost".into(),
            max_connections: 80,
            min_connections: None,
            connect_timeout: 3,
            idle_timeout: Some(120),
        },
    ));

    let rocket_config: Config = figment.extract().unwrap();

    info!("ROCKET CONFIG:");
    info!("{:?}", rocket_config);
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
            let key = BASE64_STANDARD.encode(&key);

            fs::write("secret_key.txt", &key).unwrap();
            figment = figment.merge(("secret_key", key));
        }
    }

    let (tx, rx) = watch::channel(false);

    let with_client = args.contains(&"--with-client".to_string());
    info!("> with client: {}", with_client);
    let shield = Shield::default().enable(Hsts::default());
    let mut rocket = rocket::custom(figment)
        .attach(Db::init())
        .attach(shield)
        .attach(AdHoc::try_on_ignite("SQLx Migrations", run_migrations))
        .attach(bg_worker(rx))
        .attach(AdHoc::on_shutdown("Notify shutdown", |_rocket| {
            Box::pin(async move {
                tx.send(true).unwrap();
            })
        }));

    if !is_production_build {
        rocket = rocket.attach(CORS);
    }

    let mut routes = routes::get_api_routes();
    routes.append(&mut routes![options_handler]);

    rocket = rocket
        .mount("/api", routes)
        .mount("/", routes![frontend_page])
        .register("/", catchers![not_found, default_catcher]);

    if with_client {
        rocket.mount("/", FileServer::from("../tsclient/build"))
    } else {
        rocket
    }
}
#[catch(404)]
fn not_found(req: &Request<'_>) -> serde_json::Value {
    if let Some(ip) = req.remote() {
        info!(
            "Route not found from client with IP: {}, route: {}",
            ip,
            req.uri()
        );
        let mut file = IP_LOG_FILE.lock().unwrap();
        writeln!(
            file,
            "{}: Route not found from client with IP: {}, route: {}",
            Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            ip,
            req.uri()
        )
        .unwrap();
    }

    json! ({
        "error": format!("Route not found: {}", req.uri())
    })
}

#[catch(default)]
fn default_catcher(status: Status, req: &Request<'_>) -> serde_json::Value {
    if let Some(ip) = req.remote() {
        error!("Error from client with IP: {}", ip);
        let mut file = IP_LOG_FILE.lock().unwrap();
        writeln!(
            file,
            "{}: Error from client with IP: {}",
            Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
            ip
        )
        .unwrap();
    }

    json! ({
        "error": format!("Unknown error: {}", status)
    })
}

#[options("/<_path..>")]
fn options_handler<'r>(_path: Option<PathBuf>) -> impl Responder<'r, 'static> {
    Status::Ok
}
