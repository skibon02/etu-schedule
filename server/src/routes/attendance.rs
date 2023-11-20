use std::collections::BTreeMap;
use rocket::Route;
use rocket::serde::json::Json;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use crate::models;
use crate::models::Db;
use crate::routes::auth::AuthorizeInfo;
use crate::routes::ResponseErrorMessage;

#[derive(Serialize)]
pub struct AttendanceScheduleObj {
    is_new: bool,
    auto_attendance_enabled: bool,
}

#[derive(Responder)]
pub enum GetUserAttendanceScheduleResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<BTreeMap<u32, AttendanceScheduleObj>>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}

#[get("/attendance/schedule")]
pub async fn get_user_attendance_schedule(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserAttendanceScheduleResult {
    if auth.is_none() {
        return GetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let user_saved_elements = models::attendance::get_attendance_schedule(&mut db, auth.user_id).await;

    if let Err(e) = user_saved_elements {
        error!("Failed to get user attendance schedule: {:?}", e);
        return GetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user attendance schedule!".to_string())));
    }
    let user_saved_elements = user_saved_elements.unwrap();

    let group_id = models::users::get_user_group(&mut db, auth.user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return GetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group!".to_string())));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return GetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("User has no group!".to_string())));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_current_schedule_link_ids(&mut db, group_id).await;
    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return GetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group schedule link ids!".to_string())));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    let mut res = BTreeMap::new();
    for link_id in schedule_link_ids {
        let is_new = user_saved_elements.get(&link_id).is_none();
        let auto_attendance_enabled = user_saved_elements.get(&link_id).cloned().unwrap_or(false);
        res.insert(link_id, AttendanceScheduleObj {
            is_new,
            auto_attendance_enabled,
        });
    }

    GetUserAttendanceScheduleResult::Success(Json(res))
}

#[derive(Serialize)]
pub struct SetUserAttendanceScheduleResultSuccess {
    ok: bool,
}
#[derive(Responder)]
pub enum SetUserAttendanceScheduleResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<SetUserAttendanceScheduleResultSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}

#[derive(Deserialize)]
pub struct SetUserAttendanceScheduleRequest {
    schedule_obj_time_link_id: u32,
    enable_auto_attendance: bool,
}

#[post("/attendance/schedule/update", data = "<data>")]
pub async fn set_user_attendance_schedule(mut db: Connection<Db>, auth: Option<AuthorizeInfo>,
                                          data: Json<SetUserAttendanceScheduleRequest>) -> SetUserAttendanceScheduleResult {
    // tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    if auth.is_none() {
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group!".to_string())));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("User has no group!".to_string())));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_current_schedule_link_ids(&mut db, group_id).await;

    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group schedule link ids!".to_string())));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    if !schedule_link_ids.contains(&data.schedule_obj_time_link_id) {
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Schedule object not found!".to_string())));
    }

    let res = models::attendance::set_attendance_schedule(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.enable_auto_attendance).await;

    if let Err(e) = res {
        error!("Failed to set user attendance schedule: {:?}", e);
        return SetUserAttendanceScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to set user attendance schedule!".to_string())));
    }

    SetUserAttendanceScheduleResult::Success(Json(SetUserAttendanceScheduleResultSuccess { ok: true }))
}



#[derive(Serialize)]
pub struct AttendanceScheduleDiffObj {
    is_new: bool,
    auto_attendance_enabled: bool,
}

#[derive(Responder)]
pub enum GetUserAttendanceScheduleDiffResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<BTreeMap<u32, BTreeMap<u32, AttendanceScheduleObj>>>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}

#[get("/attendance/schedule_diffs")]
pub async fn get_user_attendance_schedule_diffs(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserAttendanceScheduleDiffResult {
    if auth.is_none() {
        return GetUserAttendanceScheduleDiffResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let user_saved_elements = models::attendance::get_attendance_schedule_diffs(&mut db, auth.user_id).await;

    if let Err(e) = user_saved_elements {
        error!("Failed to get user attendance schedule: {:?}", e);
        return GetUserAttendanceScheduleDiffResult::Failed(Json(ResponseErrorMessage::new("Failed to get user attendance schedule!".to_string())));
    }
    let user_saved_elements = user_saved_elements.unwrap();

    let group_id = models::users::get_user_group(&mut db, auth.user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return GetUserAttendanceScheduleDiffResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group!".to_string())));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return GetUserAttendanceScheduleDiffResult::Failed(Json(ResponseErrorMessage::new("User has no group!".to_string())));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_current_schedule_link_ids(&mut db, group_id).await;
    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return GetUserAttendanceScheduleDiffResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group schedule link ids!".to_string())));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    let mut res = BTreeMap::new();
    for link_id in schedule_link_ids {
        let is_new = user_saved_elements.get(&link_id).is_none();
        if let Some(link_id_elems) = user_saved_elements.get(&link_id).cloned() {
            for link_id_elem in link_id_elems {
                res.entry(link_id_elem.1).or_insert(BTreeMap::new()).insert(link_id, AttendanceScheduleObj {
                    is_new,
                    auto_attendance_enabled: link_id_elem.0,
                });
            }
        }

    }

    GetUserAttendanceScheduleDiffResult::Success(Json(res))
}

#[derive(Responder)]
pub enum SetUserAttendanceDiffsScheduleResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<SetUserAttendanceScheduleResultSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}

#[derive(Deserialize)]
pub struct SetUserAttendanceDiffsScheduleRequest {
    schedule_obj_time_link_id: u32,
    week_num: u32,
    enable_auto_attendance: bool,
}

#[post("/attendance/schedule_diffs/update", data = "<data>")]
pub async fn set_user_attendance_schedule_diffs(mut db: Connection<Db>, auth: Option<AuthorizeInfo>,
                                          data: Json<SetUserAttendanceDiffsScheduleRequest>) -> SetUserAttendanceDiffsScheduleResult {
    if auth.is_none() {
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    if data.week_num > 52 {
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("Week number is too big!".to_string())));
    }

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group!".to_string())));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("User has no group!".to_string())));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_current_schedule_link_ids(&mut db, group_id).await;

    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to get user group schedule link ids!".to_string())));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    if !schedule_link_ids.contains(&data.schedule_obj_time_link_id) {
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("Schedule object not found!".to_string())));
    }

    let res = models::attendance::set_attendance_schedule_diff(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.enable_auto_attendance, data.week_num).await;

    if let Err(e) = res {
        error!("Failed to set user attendance schedule diff: {:?}", e);
        return SetUserAttendanceDiffsScheduleResult::Failed(Json(ResponseErrorMessage::new("Failed to set user attendance schedule!".to_string())));
    }

    SetUserAttendanceDiffsScheduleResult::Success(Json(SetUserAttendanceScheduleResultSuccess { ok: true }))
}

pub fn get_routes() -> Vec<Route> {
    routes![get_user_attendance_schedule, set_user_attendance_schedule,
        get_user_attendance_schedule_diffs, set_user_attendance_schedule_diffs]
}