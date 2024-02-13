use crate::models;
use crate::models::Db;
use crate::routes::auth::AuthorizeInfo;
use crate::routes::ResponderWithSuccess;
use rocket::serde::json::Json;
use rocket::Route;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Serialize)]
pub struct AttendanceScheduleObj {
    is_new: bool,
    auto_attendance_enabled: bool,
}

type GetUserAttendanceScheduleRes = ResponderWithSuccess<BTreeMap<i32, AttendanceScheduleObj>>;

#[get("/attendance/schedule")]
pub async fn get_user_attendance_schedule(
    mut db: Connection<Db>,
    auth: Option<AuthorizeInfo>,
) -> GetUserAttendanceScheduleRes {
    if auth.is_none() {
        return GetUserAttendanceScheduleRes::forbidden(Some("User is not authorized!"));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let user_saved_elements =
        models::attendance::get_attendance_schedule(&mut db, auth.user_id).await?;

    let group_id = models::users::get_user_group(&mut db, auth.user_id).await?;
    if group_id.is_none() {
        return GetUserAttendanceScheduleRes::failed(Some("User has no group!"));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids =
        models::schedule::get_active_schedule_link_ids(&mut db, group_id).await?;

    let mut res = BTreeMap::new();
    for link_id in schedule_link_ids {
        let is_new = user_saved_elements.get(&link_id).is_none();
        let auto_attendance_enabled = user_saved_elements.get(&link_id).cloned().unwrap_or(false);
        res.insert(
            link_id,
            AttendanceScheduleObj {
                is_new,
                auto_attendance_enabled,
            },
        );
    }

    GetUserAttendanceScheduleRes::success(res)
}

#[derive(Serialize)]
pub struct SetUserAttendanceScheduleResultSuccess {}
type SetUserAttendanceScheduleRes = ResponderWithSuccess<SetUserAttendanceScheduleResultSuccess>;

#[derive(Deserialize)]
pub struct SetUserAttendanceScheduleRequest {
    schedule_obj_time_link_id: i32,
    enable_auto_attendance: bool,
}

#[post("/attendance/schedule/update", data = "<data>")]
pub async fn set_user_attendance_schedule(
    mut db: Connection<Db>,
    auth: Option<AuthorizeInfo>,
    data: Json<SetUserAttendanceScheduleRequest>,
) -> SetUserAttendanceScheduleRes {
    if auth.is_none() {
        return SetUserAttendanceScheduleRes::forbidden(Some("User is not authorized!"));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await?;
    if group_id.is_none() {
        return SetUserAttendanceScheduleRes::failed(Some("User has no group!"));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids =
        models::schedule::get_active_schedule_link_ids(&mut db, group_id).await?;

    if !schedule_link_ids.contains(&data.schedule_obj_time_link_id) {
        return SetUserAttendanceScheduleRes::failed(Some("Schedule object not found!"));
    }

    models::attendance::set_attendance_schedule(
        &mut db,
        auth.user_id,
        data.schedule_obj_time_link_id,
        data.enable_auto_attendance,
    )
    .await?;

    SetUserAttendanceScheduleRes::success(SetUserAttendanceScheduleResultSuccess {})
}

#[derive(Serialize)]
pub struct SetUserAttendanceScheduleAllResultSuccess {}

type SetUserAttendanceScheduleAllRes =
    ResponderWithSuccess<SetUserAttendanceScheduleAllResultSuccess>;

#[derive(Deserialize)]
pub struct SetUserAttendanceScheduleAllRequest {
    enable_auto_attendance: bool,
}

#[post("/attendance/schedule/update_all", data = "<data>")]
pub async fn set_user_attendance_schedule_all(
    mut db: Connection<Db>,
    auth: Option<AuthorizeInfo>,
    data: Json<SetUserAttendanceScheduleAllRequest>,
) -> SetUserAttendanceScheduleAllRes {
    if auth.is_none() {
        return SetUserAttendanceScheduleAllRes::forbidden(Some("User is not authorized!"));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await?;
    if group_id.is_none() {
        return SetUserAttendanceScheduleAllRes::failed(Some("User has no group!"));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids =
        models::schedule::get_active_schedule_link_ids(&mut db, group_id).await?;
    models::attendance::set_attendance_schedule_all(
        &mut db,
        auth.user_id,
        schedule_link_ids,
        data.enable_auto_attendance,
    )
    .await?;

    SetUserAttendanceScheduleAllRes::success(SetUserAttendanceScheduleAllResultSuccess {})
}

#[derive(Serialize)]
pub struct AttendanceScheduleDiffObj {
    is_new: bool,
    auto_attendance_enabled: bool,
}

type GetUserAttendanceScheduleDiffRes =
    ResponderWithSuccess<BTreeMap<i32, BTreeMap<i32, AttendanceScheduleObj>>>;

#[get("/attendance/schedule_diffs")]
pub async fn get_user_attendance_schedule_diffs(
    mut db: Connection<Db>,
    auth: Option<AuthorizeInfo>,
) -> GetUserAttendanceScheduleDiffRes {
    if auth.is_none() {
        return GetUserAttendanceScheduleDiffRes::forbidden(Some("User is not authorized!"));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let user_saved_elements =
        models::attendance::get_attendance_schedule_diffs(&mut db, auth.user_id).await?;

    let group_id = models::users::get_user_group(&mut db, auth.user_id).await?;
    if group_id.is_none() {
        return GetUserAttendanceScheduleDiffRes::failed(Some("User has no group!"));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids =
        models::schedule::get_active_schedule_link_ids(&mut db, group_id).await?;

    let mut res = BTreeMap::new();
    for link_id in schedule_link_ids {
        let is_new = user_saved_elements.get(&link_id).is_none();
        if let Some(link_id_elems) = user_saved_elements.get(&link_id).cloned() {
            for link_id_elem in link_id_elems {
                res.entry(link_id_elem.1).or_insert(BTreeMap::new()).insert(
                    link_id,
                    AttendanceScheduleObj {
                        is_new,
                        auto_attendance_enabled: link_id_elem.0,
                    },
                );
            }
        }
    }

    GetUserAttendanceScheduleDiffRes::success(res)
}

type SetUserAttendanceDiffsScheduleRes =
    ResponderWithSuccess<SetUserAttendanceScheduleResultSuccess>;

#[derive(Deserialize)]
pub struct SetUserAttendanceDiffsScheduleRequest {
    schedule_obj_time_link_id: i32,
    week_num: i32,
    enable_auto_attendance: bool,
}

#[post("/attendance/schedule_diffs/update", data = "<data>")]
pub async fn set_user_attendance_schedule_diffs(
    mut db: Connection<Db>,
    auth: Option<AuthorizeInfo>,
    data: Json<SetUserAttendanceDiffsScheduleRequest>,
) -> SetUserAttendanceDiffsScheduleRes {
    if auth.is_none() {
        return SetUserAttendanceDiffsScheduleRes::forbidden(Some("User is not authorized!"));
    }
    let auth = auth.unwrap();

    if data.week_num > 52 {
        return SetUserAttendanceDiffsScheduleRes::failed(Some("Week number is too big!"));
    }

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await?;
    if group_id.is_none() {
        return SetUserAttendanceDiffsScheduleRes::failed(Some("User has no group!"));
    }
    let group_id = group_id.unwrap().group_id;

    // get user group link_id elements
    let schedule_link_ids =
        models::schedule::get_active_schedule_link_ids(&mut db, group_id).await?;
    if !schedule_link_ids.contains(&data.schedule_obj_time_link_id) {
        return SetUserAttendanceDiffsScheduleRes::failed(Some("Schedule object not found!"));
    }

    models::attendance::set_attendance_schedule_diff(
        &mut db,
        auth.user_id,
        data.schedule_obj_time_link_id,
        data.enable_auto_attendance,
        data.week_num,
    )
    .await?;

    SetUserAttendanceDiffsScheduleRes::Success(Json(SetUserAttendanceScheduleResultSuccess {}))
}

pub fn get_routes() -> Vec<Route> {
    routes![
        get_user_attendance_schedule,
        set_user_attendance_schedule,
        get_user_attendance_schedule_diffs,
        set_user_attendance_schedule_diffs,
        set_user_attendance_schedule_all
    ]
}
