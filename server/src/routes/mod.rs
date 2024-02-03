use crate::models::DbResult;
use rocket::serde::json::Json;
use rocket::Route;
use serde_derive::Serialize;
use std::ops::FromResidual;

mod attendance;
pub mod auth;
mod notes;
pub mod schedule;
mod user_data;

#[derive(Responder)]
pub enum GenericResponder<Success, Failure>
where
    Success: serde::Serialize,
    Failure: serde::Serialize,
{
    #[response(status = 200, content_type = "json")]
    Success(Json<Success>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<Failure>),
    #[response(status = 403, content_type = "json")]
    Forbidden(Json<Failure>),
    #[response(status = 500, content_type = "json")]
    InternalError(Json<Failure>),
}
pub type ResponderWithSuccess<T> = GenericResponder<T, ResponseErrorMessage>;

impl<T: serde::Serialize> ResponderWithSuccess<T> {
    pub fn success(data: T) -> Self {
        GenericResponder::Success(Json(data))
    }
    pub fn failed(message: &str) -> Self {
        GenericResponder::Failed(Json(ResponseErrorMessage::new(message.to_string())))
    }

    pub fn forbidden(message: &str) -> Self {
        GenericResponder::Forbidden(Json(ResponseErrorMessage::new(message.to_string())))
    }

    pub fn internal_error(message: &str) -> Self {
        GenericResponder::InternalError(Json(ResponseErrorMessage::new(message.to_string())))
    }
}

/// database error is internal error: do not expose it to the client
impl<T: serde::Serialize, R: std::fmt::Debug> FromResidual<DbResult<R>>
    for ResponderWithSuccess<T>
{
    fn from_residual(residual: DbResult<R>) -> Self {
        error!("Failed to execute database operation: {:?}", residual);
        ResponderWithSuccess::internal_error("не скажу")
    }
}

#[derive(Serialize)]
pub struct ResponseErrorMessage {
    message: String,
}

impl ResponseErrorMessage {
    pub fn new(message: String) -> Self {
        ResponseErrorMessage { message }
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
