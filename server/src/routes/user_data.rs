use rocket::Route;
use rocket::serde::json::Json;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use crate::models;
use crate::models::Db;
use crate::models::groups::GroupModel;
use crate::models::users::{SubjectsTitleFormatting, UserDataModel, UserDataOptionalModel};
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
async fn set_group(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Option<Json<SetGroupBody>>) -> SetUserGroupResult {
    if body.is_none() {
        return SetUserGroupResult::Failed(Json(ResponseErrorMessage::new("Invalid body!".to_string())));
    }
    let body = body.unwrap();
    if auth.is_none() {
        return SetUserGroupResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    let res = match body.group_id {
        Some(group_id) => models::users::set_user_group(&mut db, auth.user_id, group_id).await,
        None => models::users::reset_user_group(&mut db, auth.user_id).await,
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
pub struct SetUserDataSuccess {
    ok: bool,
}

#[derive(Responder)]
pub enum SetUserDataResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<SetUserDataSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>)
}

#[post("/user/set_data", data = "<body>")]
async fn set_data(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Option<Json<UserDataOptionalModel>>) -> SetUserDataResult {
    if body.is_none() {
        return SetUserDataResult::Failed(Json(ResponseErrorMessage::new("Invalid body!".to_string())));
    }
    let body = body.unwrap();
    if auth.is_none() {
        return SetUserDataResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    let res = models::users::set_user_data(&mut db, auth.user_id, body.into_inner()).await;

    if let Err(e) = res {
        error!("Failed to set user data: {:?}", e);

        SetUserDataResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
    } else {
        SetUserDataResult::Success(Json(SetUserDataSuccess { ok: true }))
    }
}
#[derive(Serialize)]
pub struct OutputUserDataModel {
    pub user_id: u32,
    pub group: Option<GroupModel>,
    pub subjects_title_formatting: SubjectsTitleFormatting
}


impl Into<OutputUserDataModel> for (UserDataModel, Option<GroupModel>) {
    fn into(self) -> OutputUserDataModel {
        OutputUserDataModel {
            user_id: self.0.user_id,
            group: self.0.group_id.map(|_| self.1.unwrap()),
            subjects_title_formatting: self.0.subjects_title_formatting,
        }
    }
}

#[derive(Responder)]
pub enum GetUserDataResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<OutputUserDataModel>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>)
}

#[get("/user/get_data")]
async fn get_data(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserDataResult {
    if auth.is_none() {
        return GetUserDataResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    let res = models::users::get_user_data(&mut db, auth.user_id).await;

    match res {
        Err(e) => {
            error!("Failed to get user data: {:?}", e);

            GetUserDataResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
        }
        Ok(res) => {
            if let Some(group_id) = res.group_id {
                let group = models::groups::get_group(&mut db, group_id).await;
                match group {
                    Ok(group) => GetUserDataResult::Success(Json((res, Some(group)).into())),
                    Err(e) => {
                        error!("Failed to get user group: {:?}", e);
                        GetUserDataResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
                    }
                }
            } else {
                GetUserDataResult::Success(Json((res, None).into()))
            }
        }
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
async fn get_group(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserGroupResult {
    if auth.is_none() {
        return GetUserGroupResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    let res = models::users::get_user_group(&mut db, auth.user_id).await;

    match res {
        Ok(_) => GetUserGroupResult::Success(Json(GetUserGroupSuccess { current_group: res.unwrap() })),
        Err(e) => {
            error!("Failed to get user group: {:?}", e);
            GetUserGroupResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
        }
    }
}


pub fn get_routes() -> Vec<Route> {
    routes![set_group, get_group, set_data, get_data]
}