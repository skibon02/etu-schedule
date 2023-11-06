use std::collections::BTreeMap;

use rocket::{serde::json::Json, Route};
use rocket_db_pools::Connection;

use crate::{api::etu_api::{self, ScheduleObjectOriginal}, models::groups::GroupModel, models, MERGE_REQUEST_CHANNEL};
use crate::models::Db;
use crate::models::schedule::ScheduleObjModel;

#[derive(serde::Serialize)]
pub struct OutputAuditoriumOriginal {
    displayName: String,
    number: String,
}

#[derive(serde::Serialize)]
pub struct OutputReservationTimeOriginal {
    startTime: u32,
    endTime: u32,
    week: String,
    weekDay: String,
}

#[derive(serde::Serialize)]
pub struct OutputAuditoriumReservationModel {
    auditoriumNumber: Option<String>,
    auditorium: Option<OutputAuditoriumOriginal>,
    description: String,
    #[serde(rename = "type")]
    _type: String,
    reservationTime: OutputReservationTimeOriginal,
}

#[derive(serde::Serialize)]
pub struct OutputSubjectModel {
    pub alienId: i32,
    pub title: String,
    pub shortTitle: Option<String>,
    pub subjectType: Option<String>,
    pub controlType: Option<String>,
}

#[derive(serde::Serialize)]
pub struct OutputTeacherModel {
    name: String,
    surname: String,
    midname: String,
    initials: String,

    birthday: String,
    email: Option<String>,
    groupId: Option<u32>,

    rank: Option<String>,
    position: Option<String>,
    degree: Option<String>,
    roles: Vec<String>,
    workDepartments: Option<Vec<String>>,
}

#[derive(serde::Serialize)]
pub struct OutputLessonModel {
    auditoriumReservation: OutputAuditoriumReservationModel,
    subject: OutputSubjectModel,
    teacher: OutputTeacherModel,
}
#[derive(serde::Serialize)]
pub struct OutputScheduleObjectModel {
    lesson: OutputLessonModel,
}

impl Into<OutputScheduleObjectModel> for ScheduleObjModel {
    fn into(self) -> OutputScheduleObjectModel {
        OutputScheduleObjectModel {
            lesson: OutputLessonModel{
                auditoriumReservation: OutputAuditoriumReservationModel{
                    auditoriumNumber: None,
                    auditorium: None,
                    description: "desc".to_string(),
                    _type: "schedule".to_string(),
                    reservationTime: OutputReservationTimeOriginal {
                        startTime: self.time,
                        endTime: self.time,
                        week: if self.week_parity {"1".to_string()} else {"2".to_string()},
                        weekDay: self.week_day.into(),
                    },
                },
                subject: OutputSubjectModel {
                    alienId: 0,
                    title: "subj title".to_string(),
                    shortTitle: Some("short_title".to_string()),
                    subjectType: Some("murrr".to_string()),
                    controlType: None,
                },
                teacher: OutputTeacherModel {
                    name: "teacher name".to_string(),
                    surname: "teacher surname".to_string(),
                    midname: "teacher midname".to_string(),
                    initials: "teacher initials".to_string(),

                    birthday: "teacher birthday".to_string(),
                    email: None,
                    groupId: None,

                    rank: None,
                    position: None,
                    degree: None,
                    roles: Vec::new(),
                    workDepartments: None,
                }
            }
        }
    }
}


#[get("/scheduleObjs/group/<group>")]
async fn get_group_schedule_objects(group: u32, mut con: Connection<Db>) -> Option<Json<Vec<OutputScheduleObjectModel>>> {
    let sched_objects = models::schedule::get_current_schedule_for_group(con, group).await.unwrap();

    let channel = MERGE_REQUEST_CHANNEL.get().unwrap();
    //check if it is full
    if channel.try_send(group).is_err() {
        warn!("Channel is full, skipping merge request for group {}", group);
    }

    let output: Vec<OutputScheduleObjectModel> = sched_objects.into_iter().map(|s| s.into()).collect();

    Some(Json(output))
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
