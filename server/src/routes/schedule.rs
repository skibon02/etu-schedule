use std::collections::BTreeMap;
use std::ops::DerefMut;

use rocket::{serde::json::Json, Route};
use rocket::response::status::BadRequest;
use rocket_db_pools::Connection;

use crate::{api::etu_api::{self, ScheduleObjectOriginal}, models::groups::GroupModel, models, MERGE_REQUEST_CHANNEL};
use crate::models::Db;
use crate::models::schedule::{ScheduleObjModel, SubjectModel};



#[derive(serde::Serialize)]
pub struct OutputAuditoriumReservationModel {
    auditorium_number: Option<String>,
    time: u32,
    week: String,
    week_day: String,
}

#[derive(serde::Serialize)]
pub struct OutputSubjectModel {
    pub alien_id: i32,
    pub title: String,
    pub short_title: Option<String>,
    pub subject_type: Option<String>,
    pub control_type: Option<String>,
    pub department_id: u32
}

#[derive(serde::Serialize)]
pub struct OutputTeacherModel {
    name: String,
    surname: String,
    midname: String,
    initials: String,

    birthday: String,
    email: Option<String>,
    group_id: Option<u32>,

    rank: Option<String>,
    position: Option<String>,
    degree: Option<String>,
    roles: Vec<String>,
    work_departments: Option<Vec<String>>,
}

#[derive(serde::Serialize)]
pub struct OutputScheduleObjectModel {
    auditorium_reservation: OutputAuditoriumReservationModel,
    subject: OutputSubjectModel,
    teacher: OutputTeacherModel,
    second_teacher: OutputTeacherModel,
    id: u32
}

impl TryInto<OutputScheduleObjectModel> for (ScheduleObjModel, &BTreeMap<u32, SubjectModel>) {
    type Error = String;
    fn try_into(self) -> Result<OutputScheduleObjectModel, String> {
        let sched_model = self.0;
        let subject = self.1.get(&sched_model.subject_id).map_or(Err("Subject not found!".to_string()), |r| Ok(r))?;

        Ok(OutputScheduleObjectModel {
            auditorium_reservation: OutputAuditoriumReservationModel{
                auditorium_number: None,
                time: sched_model.time,
                week: sched_model.week_parity,
                week_day: sched_model.week_day.into(),
            },
            subject: OutputSubjectModel {
                alien_id: subject.alien_id,
                title: subject.title.clone(),
                short_title: subject.short_title.clone(),
                subject_type: subject.subject_type.clone(),
                control_type: subject.control_type.clone(),
                department_id: subject.department_id,
            },
            teacher: OutputTeacherModel {
                name: "name".to_string(),
                surname: "surname".to_string(),
                midname: "midname".to_string(),
                initials: "teacher initials".to_string(),

                birthday: "teacher birthday".to_string(),
                email: None,
                group_id: None,

                rank: None,
                position: None,
                degree: None,
                roles: Vec::new(),
                work_departments: None,
            },
            second_teacher: OutputTeacherModel {
                name: "name".to_string(),
                surname: "surname".to_string(),
                midname: "midname".to_string(),
                initials: "teacher initials".to_string(),

                birthday: "teacher birthday".to_string(),
                email: None,
                group_id: None,

                rank: None,
                position: None,
                degree: None,
                roles: Vec::new(),
                work_departments: None,
            },
            id: sched_model.schedule_obj_id
        })
    }
}

#[derive(serde::Serialize)]
pub struct OutputGroupScheduleModel {
    sched_objs: Vec<OutputScheduleObjectModel>,
    is_ready: bool,
    actual_time: Option<u32>,
}


#[derive(serde::Serialize)]
pub struct OutputGroupScheduleModelError {
    message: String
}

#[get("/scheduleObjs/group/<group_id>")]
async fn get_group_schedule_objects(group_id: u32, mut con: Connection<Db>) -> Result<Json<OutputGroupScheduleModel>, BadRequest<Json<OutputGroupScheduleModelError>>> {
    let last_merge_time = models::groups::get_time_since_last_group_merge(group_id, con.deref_mut()).await;
    match last_merge_time {
        Ok(last_merge_time) => {
            match last_merge_time {
                Some(time) => {
                    let sched_objects = models::schedule::get_current_schedule_for_group(con.deref_mut(), group_id).await.unwrap();
                    let subjects = models::schedule::get_subjects_for_group(con.deref_mut(), group_id).await.unwrap();
                    let subjects_map: BTreeMap<u32, SubjectModel> = subjects.into_iter().map(|row| (row.subject_id, row.clone())).collect();

                    let channel = MERGE_REQUEST_CHANNEL.get().unwrap();
                    //check if it is full
                    if channel.try_send(group_id).is_err() {
                        warn!("Channel is full, skipping merge request for group {}", group_id);
                    }

                    let output_objs: Vec<OutputScheduleObjectModel> = sched_objects.into_iter().map(|s| (s, &subjects_map).try_into().unwrap()).collect();
                    let output = OutputGroupScheduleModel {
                        sched_objs: output_objs,
                        is_ready: true,
                        actual_time: Some(time)
                    };

                    Ok(Json(output))
                },
                None => {
                    warn!("Group {} is not yet ready!", group_id);
                    let channel = MERGE_REQUEST_CHANNEL.get().unwrap();
                    //check if it is full
                    if channel.try_send(group_id).is_err() {
                        warn!("Channel is full, skipping merge request for group {}", group_id);
                    }

                    let output = OutputGroupScheduleModel {
                        sched_objs: Vec::new(),
                        is_ready: false,
                        actual_time: None
                    };

                    Ok(Json(output))
                }
            }
        },
        Err(_) => {
            let res = OutputGroupScheduleModelError {
                message: format!("Group id wasn't found!"),
            };
            Err(BadRequest(Some(Json(res))))
        }
    }

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
