use rocket::{
    http::{uri::Host, Cookie, CookieJar, Status},
    response::Redirect,
    serde::json::Json,
    Route, request::{FromRequest, self, Request},
};
use rocket::time::PrimitiveDateTime;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::{FRONTEND_PORT, FrontendPort, models::{users::{self, UserInfo}, Db}};
use crate::api::vk_api;
use crate::routes::ResponseErrorMessage;

#[post("/auth/deauth")]
fn deauth(cookie: &CookieJar) -> Status {
    cookie.remove_private(Cookie::named("token"));
    Status::Ok
}


#[rocket::async_trait]
impl<'r> FromRequest<'r> for UserInfo {
    type Error = ();
    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> { 
        let mut db_con = req.guard::<Connection<Db>>().await.unwrap();
        match (req.cookies().get_private("token"), req.cookies().get_private("token2")) {
            (Some(token), Some(_)) => {
                let user_id = token.value().to_string().parse::<i32>().unwrap();
                let user_info = users::get_user_info(&mut db_con, user_id).await;
                match user_info {
                    Ok(user_info) => request::Outcome::Success(user_info),
                    Err(e) => {
                        error!("Failed to get user info: {:?}", e);
                        req.cookies().remove_private(Cookie::named("token"));
                        req.cookies().remove_private(Cookie::named("token2"));
                        request::Outcome::Forward(())
                    }
                }
            }
            _ => {
                warn!("Failed to get user info: no token");
                return request::Outcome::Forward(());
            }
        }
    }

}


#[derive(Serialize)]
#[derive(Default, Debug)]
pub struct AuthorizeInfo {
    pub access_token: Option<String>,
    pub user_id: i32,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthorizeInfo {
    type Error = ();
    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> { 
        let mut db_con = req.guard::<Connection<Db>>().await.unwrap();
        match (req.cookies().get_private("token"), req.cookies().get_private("token2")) {
            (Some(token), Some(token2)) => {
                let user_id = token.value().to_string().parse::<i32>().unwrap();
                let access_token = token2.value().to_string();
                if !users::user_exists(&mut db_con, user_id).await.unwrap_or(false) {
                    return request::Outcome::Forward(());
                }
                request::Outcome::Success(AuthorizeInfo {
                    access_token: Some(access_token),
                    user_id,
                })
            }
            _ => {
                return request::Outcome::Forward(());
            }
        }
    }
}

#[get("/auth/check")]
fn check_auth(_auth_info: AuthorizeInfo) -> Json<Value> {
    Json(json!({
        "is_authorized": true,
    }))
}

#[get("/auth/check", rank = 2)]
fn check_auth_fallback() -> Json<Value> {
    Json(json!({
        "is_authorized": false,
    }))
}

#[derive(Serialize)]
struct UserInfoResponse {
    user_id: String,
    first_name: String,
    last_name: String,
    profile_photo_url: Option<String>,
    sex: u8,
    birthdate: Option<String>,
    is_authorized: bool,
}

impl From<UserInfo> for UserInfoResponse {
    fn from(value: UserInfo) -> Self {
        UserInfoResponse {
            user_id: value.vk_id.to_string(),
            first_name: value.first_name,
            last_name: value.last_name,
            profile_photo_url: value.profile_photo_url,
            sex: value.sex as u8,
            birthdate: value.birthdate,
            is_authorized: true,
        }
    }
}

#[get("/auth/data")]
async fn auth_data(user_info: UserInfo) -> Json<UserInfoResponse> {
    Json(user_info.into())
}

#[get("/auth/data", rank = 2)]
async fn auth_data_fallback() -> Json<Value> {
    Json(json!({
        "is_authorized": false,
    }))
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
    load_external_users: Option<bool>,
}

#[get("/auth/redirect?<payload>")]
async fn auth_redirect(
    db: Connection<Db>,
    cookie: &CookieJar<'_>,
    host: &Host<'_>,
    payload: Json<AuthRedirectParams>,
) -> Redirect {
    let token = payload.token.clone();
    let uuid = payload.uuid.clone();

    assert_eq!(payload.auth, 1);
    assert_eq!(payload._type, "silent_token");

    let mut optional_query = "".to_string();
    if let Err(e) = process_auth(db, cookie, &token, &uuid).await {
        error!("Failed to authorize: {:?}", e);
        optional_query = "?error=auth_failed".to_string();
    }

    match FRONTEND_PORT.get().unwrap() {
        FrontendPort::Same => Redirect::to(format!("https://{}/profile{}", host, optional_query)),
        FrontendPort::Https => Redirect::to(format!("https://{}:443/profile{}", host.domain(), optional_query)),
        FrontendPort::Custom(port) => Redirect::to(format!("https://{}:{}/profile{}", host.domain(), port, optional_query)),
    }
}

#[derive(Deserialize)]
struct AuthParams {
    silent_token: String,
    uuid: String,
}

#[post("/authorize", data = "<auth_params>")]
async fn authorize(
    db: Connection<Db>,
    cookie: &CookieJar<'_>,
    auth_params: Option<Json<AuthParams>>,
) -> Status {
    if auth_params.is_none() {
        return Status::BadRequest;
    }
    let auth_params = auth_params.unwrap();

    debug!("> AUTH: silent_token: {:?}", auth_params.silent_token);
    debug!("> AUTH: uuid: {:?}", auth_params.uuid);

    match process_auth(db, cookie, &auth_params.silent_token, &auth_params.uuid).await {
        Ok(_) => Status::Ok,
        Err(AuthorizeError::FailedVkRequest) => {
            error!("Failed to authorize: vk request failed");
            Status::InternalServerError
        }
        Err(AuthorizeError::FailedDbRequest) => {
            error!("Failed to authorize: db request failed");
            Status::InternalServerError
        }
    }
}

#[derive(Debug)]
enum AuthorizeError {
    FailedVkRequest,
    FailedDbRequest,
}

/// for VK API users.get with photo_200,contacts,bdate
fn parse_auth_info(inp: serde_json::Value) -> UserInfo {
    UserInfo {
        first_name: inp["first_name"].as_str().unwrap_or("").to_owned(),
        last_name: inp["last_name"].as_str().unwrap_or("").to_owned(),
        vk_id: inp["id"].as_u64().unwrap_or_default() as i32,
        birthdate: inp["bdate"].as_str().map(|v| v.to_owned()),
        profile_photo_url: inp["photo_200"].as_str().map(|v| v.to_owned()),
        sex: inp["sex"].as_u64().unwrap_or_default() as i32, // you might want to handle this unwrap in a way that fits your app's error handling

        // not used
        created_timestamp: PrimitiveDateTime::MIN,
        last_vk_fetch_timestamp:PrimitiveDateTime::MIN,
    }
}
async fn process_auth(db: Connection<Db>, cookie: &CookieJar<'_>, token: &str, uuid: &str) -> Result<(), AuthorizeError> {
    let access_token =  vk_api::exchange_access_token(token, uuid).await;

    let user_info = vk_api::users_get(&access_token, "photo_200,sex,bdate").await.ok_or(AuthorizeError::FailedVkRequest)?;
    info!("VK user: {:?}", user_info);
    let auth_info = (access_token, user_info["id"].to_string());
    let user_info = parse_auth_info(user_info.into_inner());

    if let Err(err) = users::create_user(db, user_info).await {
        error!("Failed to create user: {}", err);
        return Err(AuthorizeError::FailedDbRequest);
    }

    debug!("adding token to cookie...");

    cookie.add_private(Cookie::build("token", auth_info.1).same_site(rocket::http::SameSite::Lax).http_only(true).finish());
    cookie.add_private(Cookie::build("token2", auth_info.0).same_site(rocket::http::SameSite::Lax).http_only(true).finish());
    Ok(())
}

pub fn get_routes() -> Vec<Route> {
    routes![check_auth, check_auth_fallback, 
    auth_data, auth_data_fallback,
    auth_redirect, authorize, deauth]
}
