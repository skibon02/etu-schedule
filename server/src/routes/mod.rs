use rocket::Route;
use rocket::serde::json::Json;
use serde_derive::Serialize;

pub mod auth;
pub mod schedule;
mod user_data;
mod attendance;
mod notes;

#[derive(Responder)]
pub enum GenericResponder<Success, Failure>
    where Success: serde::Serialize, Failure: serde::Serialize {
    #[response(status = 200, content_type = "json")]
    Success(Json<Success>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<Failure>),
    #[response(status = 403, content_type = "json")]
    Forbidden(Json<Failure>),
}
pub type ResponderWithSuccess<T> = GenericResponder<T, ResponseErrorMessage>;

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
    routes.append(&mut notes::get_routes());
    routes
}
