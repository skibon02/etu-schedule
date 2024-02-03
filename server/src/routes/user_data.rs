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
use crate::routes::{GenericResponder, ResponderWithSuccess, ResponseErrorMessage};

#[derive(Serialize)]
pub struct SetUserGroupSuccess {
    ok: bool,
}
type SetUserGroupRes = ResponderWithSuccess<SetUserGroupSuccess>;

#[derive(Deserialize)]
struct SetGroupBody {
    group_id: Option<i32>,
}

#[post("/user/set_group", data = "<body>")]
async fn set_group(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Json<SetGroupBody>) -> SetUserGroupRes {
    if auth.is_none() {
        return SetUserGroupRes::forbidden("User is not authorized!");
    }
    let auth = auth.unwrap();

    let res = match body.group_id {
        Some(group_id) => models::users::set_user_group(&mut db, auth.user_id, group_id).await,
        None => models::users::reset_user_group(&mut db, auth.user_id).await,
    };

    if let Err(e) = res {
        error!("Failed to set user group: {:?}", e);

        if let Some(e) = e.downcast_ref::<models::users::SetUserGroupError>() {
            SetUserGroupRes::failed(&e.to_string())
        } else {
            SetUserGroupRes::internal_error("не скажу")
        }
    } else {
        SetUserGroupRes::success(SetUserGroupSuccess { ok: true })
    }
}

#[derive(Serialize)]
pub struct SetUserDataSuccess {
    ok: bool,
}

type SetUserDataRes = ResponderWithSuccess<SetUserDataSuccess>;

#[post("/user/set_data", data = "<body>")]
async fn set_data(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Json<UserDataOptionalModel>) -> SetUserDataRes {
    if auth.is_none() {
        return SetUserDataRes::failed("User is not authorized!");
    }
    let auth = auth.unwrap();

    models::users::set_user_data(&mut db, auth.user_id, body.into_inner()).await?;

    SetUserDataRes::success(SetUserDataSuccess { ok: true })
}
#[derive(Serialize)]
pub struct OutputUserDataModel {
    pub user_id: i32,
    pub group: Option<GroupModel>,
    pub subjects_title_formatting: SubjectsTitleFormatting,
    pub attendance_token: Option<String>,
    pub leader_for_group: Option<i32>
}


impl Into<OutputUserDataModel> for (UserDataModel, Option<GroupModel>) {
    fn into(self) -> OutputUserDataModel {
        OutputUserDataModel {
            user_id: self.0.user_id,
            group: self.0.group_id.map(|_| self.1.unwrap()),
            subjects_title_formatting: self.0.subjects_title_formatting,
            attendance_token: self.0.attendance_token,
            leader_for_group: self.0.leader_for_group
        }
    }
}

type GetUserDataRes = ResponderWithSuccess<OutputUserDataModel>;

#[get("/user/get_data")]
async fn get_data(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserDataRes {
    if auth.is_none() {
        return GetUserDataRes::forbidden("User is not authorized!");
    }
    let auth = auth.unwrap();

    let res = models::users::get_user_data(&mut db, auth.user_id).await?;

    if let Some(group_id) = res.group_id {
        let group = models::groups::get_group(&mut db, group_id).await?;
        GetUserDataRes::success((res, Some(group.unwrap())).into())
    } else {
        GetUserDataRes::success((res, None).into())
    }
}

#[derive(Serialize)]
pub struct GetUserGroupSuccess {
    current_group: Option<GroupModel>,
}

type GetUserGroupRes = ResponderWithSuccess<GetUserGroupSuccess>;

#[get("/user/get_group")]
async fn get_group(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserGroupRes {
    if auth.is_none() {
        return GetUserGroupRes::forbidden("User is not authorized!");
    }
    let auth = auth.unwrap();

    let res = models::users::get_user_group(&mut db, auth.user_id).await?;
    GetUserGroupRes::success(GetUserGroupSuccess { current_group: res })
}

#[derive(Serialize)]
pub struct SetAttendanceTokenSuccess {
    ok: bool,
    group_changed: bool,
    result_code: String,
}

type SetAttendanceTokenRes = ResponderWithSuccess<SetAttendanceTokenSuccess>;

#[derive(Deserialize)]
pub struct SetAttendanceTokenBody {
    attendance_token: Option<String>,
}

static LAST_ATTENDANCE_FETCH_TIME: std::sync::atomic::AtomicI64 = std::sync::atomic::AtomicI64::new(0);

#[post("/user/set_attendance_token", data = "<body>")]
pub async fn set_attendance_token(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, body: Json<SetAttendanceTokenBody>) -> SetAttendanceTokenRes {
    let timestamp = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as i64;

    if timestamp - LAST_ATTENDANCE_FETCH_TIME.load(std::sync::atomic::Ordering::Relaxed) < 3 {
        warn!("Too many requests to attendance api!");
        return SetAttendanceTokenRes::success(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "too_many_requests".to_string() });
    }
    LAST_ATTENDANCE_FETCH_TIME.store(timestamp, std::sync::atomic::Ordering::Relaxed);

    if auth.is_none() {
        return SetAttendanceTokenRes::forbidden("User is not authorized!");
    }
    let auth = auth.unwrap();

    //check if token is valid
    let mut group_changed = false;
    if let Some(token) = &body.attendance_token {
        // check if token is valid

        info!("Acquiring information about user token...");
        let attendance_user_info = api::etu_attendance_api::get_current_user(token.clone()).await?;
        let (is_leader, group) = match attendance_user_info {
            GetCurrentUserResult::Ok(res) => {
                debug!("User info for user_id {} request result: {:?}", auth.user_id, res);
                if res.groups.len() == 0 {
                        return SetAttendanceTokenRes::success(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "no_groups".to_string() });
                }
                if res.groups.len() > 1 {
                    return SetAttendanceTokenRes::success(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "too_many_groups".to_string() });
                }
                (res.groups[0].UserGroup.role == "leader", res.groups[0].name.clone())
            }
            GetCurrentUserResult::WrongToken => {
                warn!("Wrong token: {}", token);
                return SetAttendanceTokenRes::success(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "wrong_token".to_string() });
            }
        };

        //search if such group exists
        info!("searching for group match: {}...", group);
        let new_user_group = models::groups::find_group_by_name(&mut db, &group).await?;
        if let Some(new_user_group) = new_user_group {
            info!("group found: id {}", new_user_group.group_id);
            let new_user_group_id = new_user_group.group_id;

            //confirm group leader role
            if is_leader {
                info!("User {} is confirmed to be a leader for group {}", auth.user_id, new_user_group_id);
                // save privilege level to db
                models::users::confirm_privilege_level(&mut db, new_user_group_id, auth.user_id).await?;
            }

            // -1 in case when group is not set will not be equal to any valid group
            let own_group = models::users::get_user_group(&mut db, auth.user_id).await?.map(|g| g.group_id).unwrap_or(-1);
            if own_group != new_user_group_id {
                group_changed = true;

                models::users::set_user_group(&mut db, auth.user_id, new_user_group_id).await?;
            }
        }
        else {
            warn!("Group was {} not found!", group);
            return SetAttendanceTokenRes::success(SetAttendanceTokenSuccess{ ok: false, group_changed: false, result_code: "group_not_found".to_string() });
        }
    }

    models::users::set_attendance_token(&mut db, auth.user_id, body.attendance_token.clone()).await?;
    SetAttendanceTokenRes::success(SetAttendanceTokenSuccess { ok: true, group_changed, result_code: "success".to_string() })
}

pub fn get_routes() -> Vec<Route> {
    routes![set_group, get_group, set_data, get_data,
    set_attendance_token]
}