use std::path::PathBuf;

use rocket::{Route, http::{CookieJar, uri::Host, Status, Cookie}, response::Redirect, form::{Form, Strict}, serde::json::Json};
use serde_derive::Deserialize;

use crate::{FRONTEND_PORT, FrontendPort, models::users};


#[post("/auth/deauth")]
fn deauth(cookie: &CookieJar) -> Status {
    cookie.remove_private(Cookie::named("token"));
    Status::Ok
}


#[get("/auth/check")]
fn check_auth(cookie: &CookieJar) -> String {
    match cookie.get_private("token") {
        Some(token) => {
            println!("> AUTH: user's token is: {}", token);
            "true".to_string()
        }
        None => "false".to_string(),
    }
}

#[derive(Deserialize, Debug)]
struct UserVkData {
    id: u32,
    first_name: String,
    last_name: String,
    avatar: String,
    phone: String,
}

#[derive(Deserialize, Debug)]
struct AuthRedirectParams {
    auth: u32,
    #[serde(rename = "type")]
    _type: String,
    user: UserVkData,
    token: String,
    ttl: u32,
    uuid: String,
    hash: String,
    #[serde(rename = "loadExternalUsers")]
    load_external_users: bool
}

#[get("/auth/redirect?<payload>")]
async fn auth_redirect (cookie: &CookieJar<'_>, host: &Host<'_>, payload: Json<AuthRedirectParams>) -> Redirect {
    let token = payload.token.clone();
    let uuid = payload.uuid.clone();

    assert_eq!(payload.auth, 1);
    assert_eq!(payload._type, "silent_token");

    process_auth(cookie, &token, &uuid).await;

    match FRONTEND_PORT.get().unwrap() {
        FrontendPort::Same => {
            Redirect::to(format!("https://{}", host))
        }
        FrontendPort::Https => {
            Redirect::to(format!("https://{}:443", host.domain()))
        }
        FrontendPort::Custom(port) => {
            Redirect::to(format!("https://{}:{}", host.domain(), port))
        }
    }
}


#[derive(Deserialize)]
struct AuthParams {
    silent_token: String,
    uuid: String,
}

#[post("/authorize", data="<auth_params>")]
async fn authorize(cookie: &CookieJar<'_>, auth_params: Json<AuthParams>) -> Status {
    debug!("> AUTH: silent_token: {:?}", auth_params.silent_token);
    debug!("> AUTH: uuid: {:?}", auth_params.uuid);

    process_auth(cookie, &auth_params.silent_token, &auth_params.uuid).await;

    Status::Ok
}


async fn process_auth(cookie: &CookieJar<'_>,token: &str, uuid: &str) {
    let auth_info = crate::vk_api::exchange_access_token(token, uuid).await;
    debug!("access_token: {}", auth_info.0);

    if users::create_user(&auth_info.1).await.is_err() {
        error!("Failed to create user");
        return;
    }

    debug!("adding token to cookie...");
    cookie.add_private(Cookie::new("token", auth_info.1));
}


pub fn get_routes() -> Vec<Route> {
    routes![check_auth, auth_redirect, authorize, deauth]
}
