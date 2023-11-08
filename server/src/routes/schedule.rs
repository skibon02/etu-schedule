use std::collections::BTreeMap;
use std::ops::DerefMut;

use rocket::{serde::json::Json, Route};
use rocket::response::status::BadRequest;
use rocket_db_pools::Connection;
use sqlx::Acquire;

use crate::{models::groups::GroupModel, models, MERGE_REQUEST_CHANNEL, MERGE_REQUEST_CNT};
use crate::models::Db;
use crate::models::schedule::{ScheduleObjModel};
use crate::models::subjects::SubjectModel;
use crate::models::teachers::TeacherModel;


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
    work_departments: Vec<String>,

    is_department_dispatcher: bool,
    is_department_head: bool,
    is_student: bool,
    is_worker: bool,
}

impl Into<OutputTeacherModel> for (TeacherModel, Vec<String>) {
    fn into(self) -> OutputTeacherModel {
        let teacher = self.0;
        let work_departments = self.1;

        OutputTeacherModel {
            initials: teacher.initials,
            group_id: teacher.group_id,
            is_department_dispatcher: teacher.is_department_dispatcher,
            is_department_head: teacher.is_department_head,
            is_student: teacher.is_student,
            is_worker: teacher.is_worker,

            position: teacher.position,
            work_departments,
            birthday: teacher.birthday,
            degree: teacher.degree,
            email: teacher.email,
            midname: teacher.midname,
            name: teacher.name,
            rank: teacher.rank,
            surname: teacher.surname

        }
    }
}

#[derive(serde::Serialize)]
pub struct OutputScheduleObjectModel {
    auditorium_reservation: OutputAuditoriumReservationModel,
    subject: OutputSubjectModel,
    teacher: Option<OutputTeacherModel>,
    second_teacher: Option<OutputTeacherModel>,
    third_teacher: Option<OutputTeacherModel>,
    fourth_teacher: Option<OutputTeacherModel>,
    id: u32
}

impl TryInto<OutputScheduleObjectModel> for (ScheduleObjModel, &BTreeMap<u32, SubjectModel>, &BTreeMap<u32, (TeacherModel, Vec<String>)>) {
    type Error = String;
    fn try_into(self) -> Result<OutputScheduleObjectModel, String> {
        let sched_model = self.0;
        let subject = self.1.get(&sched_model.subject_id).map_or(Err("Subject not found!".to_string()), |r| Ok(r))?;

        let first_teacher = match sched_model.teacher_id {
            Some(id) => Some(self.2.get(&id).cloned().map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?),
            None => None
        };
        let second_teacher = match sched_model.second_teacher_id {
            Some(id) => Some(self.2.get(&id).cloned().map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?),
            None => None
        };
        let third_teacher = match sched_model.third_teacher_id {
            Some(id) => Some(self.2.get(&id).cloned().map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?),
            None => None
        };
        let fourth_teacher = match sched_model.fourth_teacher_id {
            Some(id) => Some(self.2.get(&id).cloned().map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?),
            None => None
        };

        Ok(OutputScheduleObjectModel {
            auditorium_reservation: OutputAuditoriumReservationModel{
                auditorium_number: sched_model.auditorium,
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
            teacher: first_teacher.map(|t| t.into()),
            second_teacher: second_teacher.map(|t| t.into()),
            third_teacher: third_teacher.map(|t| t.into()),
            fourth_teacher: fourth_teacher.map(|t| t.into()),
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
                    let subjects = models::subjects::get_subjects_for_group(con.deref_mut(), group_id).await.unwrap();
                    let subjects_map: BTreeMap<u32, SubjectModel> = subjects.into_iter().map(|row| (row.subject_id, row.clone())).collect();

                    let teachers = models::teachers::get_teachers_for_group(con.deref_mut(), group_id).await.unwrap();
                    let mut teachers_map: BTreeMap<u32, (TeacherModel, Vec<String>)> = BTreeMap::new();
                    for teacher in teachers {
                        let teacher_departments = models::teachers::get_teacher_departments(teacher.teacher_id, &mut *con).await.unwrap();
                        teachers_map.insert(teacher.teacher_id, (teacher, teacher_departments));
                    }

                    let channel = MERGE_REQUEST_CHANNEL.get().unwrap();
                    //check if it is full
                    if channel.try_send(group_id).is_err() {
                        warn!("Channel is full, skipping merge request for group {}", group_id);
                    }
                    else {
                        MERGE_REQUEST_CNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    }

                    let output_objs: Vec<OutputScheduleObjectModel> = sched_objects.into_iter().map(|s| (s, &subjects_map, &teachers_map).try_into().unwrap()).collect();
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
                    else {
                        MERGE_REQUEST_CNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
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
async fn get_groups(mut con: Connection<Db>) -> Json<BTreeMap<u32, GroupModel>> {
    let groups = models::groups::get_groups(con.deref_mut()).await.unwrap();
    let mut out_groups = BTreeMap::new();
    for g in groups.into_iter() {
        out_groups.insert(g.group_id, g);
    }
    Json(out_groups)
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups]
}
