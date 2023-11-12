use rocket::Route;
use rocket::serde::json::Json;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use crate::models;
use crate::models::Db;
use crate::models::groups::GroupModel;
use crate::routes::auth::AuthorizeInfo;
use crate::routes::ResponseErrorMessage;

#[derive(Serialize)]
pub struct SetUserGroupSuccess {
    ok: bool,
}

#[derive(Responder)]
pub enum SetUserGroupResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<SetUserGroupSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>)
}

#[derive(Deserialize)]
struct SetGroupBody {
    group_id: Option<u32>,
}

#[post("/user/set_group", data = "<body>")]
async fn set_group(db: Connection<Db>, auth: AuthorizeInfo, body: Json<SetGroupBody>) -> SetUserGroupResult {
    let res = match body.group_id {
        Some(group_id) => models::users::set_user_group(db, auth.user_id, group_id).await,
        None => models::users::reset_user_group(db, auth.user_id).await,
    };

    if let Err(e) = res {
        error!("Failed to set user group: {:?}", e);

        if let Some(e) = e.downcast_ref::<models::users::SetUserGroupError>() {
            SetUserGroupResult::Failed(Json(ResponseErrorMessage::new(e.to_string())))
        } else {
            SetUserGroupResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
        }
    } else {
        SetUserGroupResult::Success(Json(SetUserGroupSuccess { ok: true }))
    }
}

#[derive(Serialize)]
pub struct GetUserGroupSuccess {
    current_group: Option<GroupModel>,
}
#[derive(Responder)]
pub enum GetUserGroupResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<GetUserGroupSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}
#[get("/user/get_group")]
async fn get_group(db: Connection<Db>, auth: AuthorizeInfo) -> GetUserGroupResult {
    let res = models::users::get_user_group(db, auth.user_id).await;

    match res {
        Ok(_) => GetUserGroupResult::Success(Json(GetUserGroupSuccess { current_group: res.unwrap() })),
        Err(e) => {
            error!("Failed to get user group: {:?}", e);
            GetUserGroupResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
        }
    }
}


pub fn get_routes() -> Vec<Route> {
    routes![set_group, get_group]
}