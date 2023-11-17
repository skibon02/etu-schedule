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
    schedule_obj_time_link_id: u32,
    is_new: bool,
    auto_attendance_enabled: bool,
}

#[derive(Responder)]
pub enum GetUserAttendanceScheduleResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<Vec<AttendanceScheduleObj>>),
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

    let mut res = Vec::new();
    for link_id in schedule_link_ids {
        let is_new = user_saved_elements.get(&link_id).is_none();
        let auto_attendance_enabled = user_saved_elements.get(&link_id).cloned().unwrap_or(false);
        res.push(AttendanceScheduleObj {
            schedule_obj_time_link_id: link_id,
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

pub fn get_routes() -> Vec<Route> {
    routes![get_user_attendance_schedule, set_user_attendance_schedule]
}