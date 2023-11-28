use rocket::Route;
use rocket::serde::json::Json;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use crate::{api, models};
use crate::api::etu_attendance_api::GetCurrentUserResult;
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
    group_id: Option<i32>,
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
    pub user_id: i32,
    pub group: Option<GroupModel>,
    pub subjects_title_formatting: SubjectsTitleFormatting,
    pub attendance_token: Option<String>,
}


impl Into<OutputUserDataModel> for (UserDataModel, Option<GroupModel>) {
    fn into(self) -> OutputUserDataModel {
        OutputUserDataModel {
            user_id: self.0.user_id,
            group: self.0.group_id.map(|_| self.1.unwrap()),
            subjects_title_formatting: self.0.subjects_title_formatting,
            attendance_token: self.0.attendance_token,
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
                    Ok(group) => GetUserDataResult::Success(Json((res, Some(group.unwrap())).into())),
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

#[derive(Serialize)]
pub struct SetAttendanceTokenSuccess {
    ok: bool,
    group_changed: bool,
    result_code: String,
}
#[derive(Responder)]
pub enum SetAttendanceTokenResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<SetAttendanceTokenSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>)
}

#[derive(Deserialize)]
pub struct SetAttendanceTokenBody {
    attendance_token: Option<String>,
}

static LAST_ATTENDANCE_FETCH_TIME: std::sync::atomic::AtomicI64 = std::sync::atomic::AtomicI64::new(0);

#[post("/user/set_attendance_token", data = "<body>")]
pub async fn set_attendance_token(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Option<Json<SetAttendanceTokenBody>>) -> SetAttendanceTokenResult {
    let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;

    if timestamp - LAST_ATTENDANCE_FETCH_TIME.load(std::sync::atomic::Ordering::Relaxed) < 3 {
        warn!("Too many requests to attendance api!");
        return SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "too_many_requests".to_string() }));
    }
    LAST_ATTENDANCE_FETCH_TIME.store(timestamp, std::sync::atomic::Ordering::Relaxed);

    if body.is_none() {
        return SetAttendanceTokenResult::Failed(Json(ResponseErrorMessage::new("Invalid body!".to_string())));
    }
    let body = body.unwrap();
    if auth.is_none() {
        return SetAttendanceTokenResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    //check if token is valid
    let mut group_changed = false;
    if let Some(token) = &body.attendance_token {
        // check if token is valid

        info!("Acquiring information about user token...");
        let attendance_user_info = api::etu_attendance_api::get_current_user(token.clone()).await;
        let group = match attendance_user_info {
            GetCurrentUserResult::Ok(res) => {
                debug!("User info for user_id {} request result: {:?}", auth.user_id, res);
                if res.groups.len() == 0 {
                        return SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "no_groups".to_string() }));
                }
                if res.groups.len() > 1 {
                    return SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "too_many_groups".to_string() }));
                }
                res.groups[0].name.clone()
            }
            GetCurrentUserResult::WrongToken => {
                warn!("Wrong token: {}", token);
                return SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "wrong_token".to_string() }));
            }
            GetCurrentUserResult::Error(e) => {
                error!("Failed to get user info: {:?}", e);
                return SetAttendanceTokenResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())));
            }
        };

        //search if such group exists
        info!("searching for group match: {}...", group);
        let new_user_group = models::groups::find_group_by_name(&mut db, &group).await.unwrap();
        if let Some(new_user_group) = new_user_group {
            info!("group found: id {}", new_user_group.group_id);
            let new_user_group_id = new_user_group.group_id;

            // -1 in case when group is not set will not be equal to any valid group
            let own_group = models::users::get_user_group(&mut db, auth.user_id).await.unwrap().map(|g| g.group_id).unwrap_or(-1);
            if own_group != new_user_group_id {
                group_changed = true;

                models::users::set_user_group(&mut db, auth.user_id, new_user_group_id).await.unwrap();
            }
        }
        else {
            warn!("Group was {} not found!", group);
            return SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "group_not_found".to_string() }));
        }
    }

    let res = models::users::set_attendance_token(&mut db, auth.user_id, body.attendance_token.clone()).await;

    match res {
        Ok(()) => SetAttendanceTokenResult::Success(Json(SetAttendanceTokenSuccess { ok: true, group_changed, result_code: "success".to_string() })),
        Err(e) => {
            error!("Failed to set attendance token: {:?}", e);
            SetAttendanceTokenResult::Failed(Json(ResponseErrorMessage::new("не скажу".to_string())))
        }
    }
}


pub fn get_routes() -> Vec<Route> {
    routes![set_group, get_group, set_data, get_data,
    set_attendance_token]
}