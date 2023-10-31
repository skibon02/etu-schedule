use std::collections::BTreeMap;

use rocket::{serde::json::Json, Route};
use rocket_db_pools::Connection;

use crate::{api::etu_api::{self, ScheduleObjectOriginal}, models::groups::GroupModel, models};
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
async fn get_groups(con: Connection<Db>) -> Json<BTreeMap<u32, GroupModel>> {
    let groups = models::groups::get_groups(con).await.unwrap();
    let mut out_groups = BTreeMap::new();
    for g in groups.into_iter() {
        out_groups.insert(g.group_id, g);
    }
    Json(out_groups)
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups]
}
