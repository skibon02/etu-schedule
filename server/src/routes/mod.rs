use rocket::Route;
use serde_derive::Serialize;

pub mod auth;
pub mod schedule;
mod user_data;
mod attendance;


#[derive(Serialize)]
pub struct ResponseErrorMessage {
    message: String
}

impl ResponseErrorMessage {
    pub fn new(message: String) -> Self {
        ResponseErrorMessage {
            message
        }
    }
}

pub fn get_api_routes() -> Vec<Route> {
    let mut routes = Vec::new();
    routes.append(&mut auth::get_routes());
    routes.append(&mut schedule::get_routes());
    routes.append(&mut user_data::get_routes());
    routes.append(&mut attendance::get_routes());
    routes
}
