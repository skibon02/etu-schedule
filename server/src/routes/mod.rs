use rocket::Route;
use serde_derive::Serialize;

pub mod auth;
pub mod schedule;
mod user_data;


#[derive(Serialize)]
pub struct ResponseErrorMessage {
    message: String,
    ok: bool
}

impl ResponseErrorMessage {
    pub fn new(message: String) -> Self {
        ResponseErrorMessage {
            message,
            ok: false
        }
    }
}

pub fn get_api_routes() -> Vec<Route> {
    let mut routes = Vec::new();
    routes.append(&mut auth::get_routes());
    routes.append(&mut schedule::get_routes());
    routes.append(&mut user_data::get_routes());
    routes
}
