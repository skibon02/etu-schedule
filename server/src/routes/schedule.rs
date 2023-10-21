use rocket::{serde::json::Json, Route};
use serde_json::Value;

use crate::etu_api;

#[get("/scheduleObjs/group/<group>")]
async fn get_group_schedule_objects(group: usize) -> Json<Value> {
    let json = etu_api::get_schedule_objs_group(group).await;
    let return_json = json[0]["scheduleObjects"].clone();
    Json(return_json)
}

#[get("/groups")]
async fn get_groups() -> Json<Value> {
    etu_api::get_groups_list().await
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups]
}
