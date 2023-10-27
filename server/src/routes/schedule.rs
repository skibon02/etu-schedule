use std::collections::BTreeMap;

use rocket::{serde::json::Json, Route};

use crate::{api::etu_api::{self, ScheduleObjectOriginal}, models::groups::GroupsModel, data_merges::groups};

#[get("/scheduleObjs/group/<group>")]
async fn get_group_schedule_objects(group: usize) -> Json<Vec<ScheduleObjectOriginal>> {
    let sched_objects = etu_api::get_schedule_objs_group(group).await;
    if sched_objects.is_empty() {
        return Json(vec![]);
    }
    Json(sched_objects[0].scheduleObjects.clone())
}

#[get("/groups")]
async fn get_groups() -> Json<BTreeMap<u32, GroupsModel>> {
    let new_groups = etu_api::get_groups_list().await;
    groups::process_merge(&new_groups);

    Json(new_groups)
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups]
}
