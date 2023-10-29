use std::collections::BTreeMap;

use rocket::{serde::json::Json, Route};
use rocket_db_pools::Connection;

use crate::{api::etu_api::{self, ScheduleObjectOriginal}, models::groups::GroupsModel, data_merges::groups};
use crate::api::etu_api::DepartmentOriginal;
use crate::models::Db;

#[get("/scheduleObjs/group/<group>")]
async fn get_group_schedule_objects(group: usize) -> Json<Vec<ScheduleObjectOriginal>> {
    let sched_objects = etu_api::get_schedule_objs_group(group).await;
    if sched_objects.is_empty() {
        return Json(vec![]);
    }
    Json(sched_objects[0].scheduleObjects.clone())
}

#[get("/groups")]
async fn get_groups(con: Connection<Db>) -> Json<BTreeMap<u32, GroupsModel>> {
    let new_groups = etu_api::get_groups_list().await;
    groups::process_merge(&new_groups, con).await.unwrap();

    let mut out_groups = BTreeMap::new();
    for (k,(v,_)) in new_groups.into_iter() {
        out_groups.insert(k, v);
    }
    Json(out_groups)
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups]
}
