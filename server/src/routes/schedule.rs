use std::collections::BTreeMap;
use std::ops::DerefMut;

use rocket::Route;
use rocket_db_pools::Connection;

use crate::api::etu_attendance_api::SemesterInfo;
use crate::bg_workers::{MERGE_REQUEST_CHANNEL, MERGE_REQUEST_CNT};
use crate::models::schedule::ScheduleObjModel;
use crate::models::subjects::SubjectModel;
use crate::models::teachers::TeacherModel;
use crate::models::Db;
use crate::routes::ResponderWithSuccess;
use crate::{api, models, models::groups::GroupModel};

#[derive(serde::Serialize)]
pub struct OutputAuditoriumReservationModel {
    auditorium_number: Option<String>,
    time: i32,
    week: String,
    week_day: String,
}

#[derive(serde::Serialize)]
pub struct OutputSubjectModel {
    pub alien_id: i32,
    pub title: String,
    pub short_title: String,
    pub subject_type: String,
    pub control_type: Option<String>,
    pub department_id: i32,
}

#[derive(serde::Serialize)]
pub struct OutputTeacherModel {
    id: i32,
    name: String,
    surname: String,
    midname: String,
    initials: String,

    birthday: String,
    email: Option<String>,
    group_id: Option<i32>,

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
            id: teacher.teacher_id,

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
            surname: teacher.surname,
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
    id: i32,
    time_link_id: i32,
}

impl TryInto<OutputScheduleObjectModel>
    for (
        ScheduleObjModel,
        &BTreeMap<i32, SubjectModel>,
        &BTreeMap<i32, (TeacherModel, Vec<String>)>,
    )
{
    type Error = String;
    fn try_into(self) -> Result<OutputScheduleObjectModel, String> {
        let sched_model = self.0;
        let subject = self
            .1
            .get(&sched_model.subject_id)
            .map_or(Err("Subject not found!".to_string()), |r| Ok(r))?;

        let first_teacher = match sched_model.teacher_id {
            Some(id) => Some(
                self.2
                    .get(&id)
                    .cloned()
                    .map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?,
            ),
            None => None,
        };
        let second_teacher = match sched_model.second_teacher_id {
            Some(id) => Some(
                self.2
                    .get(&id)
                    .cloned()
                    .map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?,
            ),
            None => None,
        };
        let third_teacher = match sched_model.third_teacher_id {
            Some(id) => Some(
                self.2
                    .get(&id)
                    .cloned()
                    .map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?,
            ),
            None => None,
        };
        let fourth_teacher = match sched_model.fourth_teacher_id {
            Some(id) => Some(
                self.2
                    .get(&id)
                    .cloned()
                    .map_or(Err(format!("Teacher {} not found!", id)), |r| Ok(r))?,
            ),
            None => None,
        };

        Ok(OutputScheduleObjectModel {
            auditorium_reservation: OutputAuditoriumReservationModel {
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
            id: sched_model.schedule_obj_id,
            time_link_id: sched_model.time_link_id,
        })
    }
}

#[derive(serde::Serialize)]
pub struct OutputGroupScheduleModel {
    sched_objs: Vec<OutputScheduleObjectModel>,
    is_ready: bool,
    actual_time: Option<i32>,
}

type GetGroupScheduleObjectsRes = ResponderWithSuccess<OutputGroupScheduleModel>;

#[get("/scheduleObjs/group/<group_id>")]
async fn get_group_schedule_objects(
    group_id: i32,
    mut con: Connection<Db>,
) -> GetGroupScheduleObjectsRes {
    let last_merge_time =
        models::groups::get_time_since_last_group_merge(group_id, con.deref_mut()).await?;

    match last_merge_time {
        Some(time) => {
            let sched_objects =
                models::schedule::get_active_schedule_for_group(con.deref_mut(), group_id).await?;
            let subjects =
                models::subjects::get_subjects_for_group(con.deref_mut(), group_id).await?;
            let subjects_map: BTreeMap<i32, SubjectModel> = subjects
                .into_iter()
                .map(|row| (row.subject_id, row.clone()))
                .collect();

            let teachers =
                models::teachers::get_teachers_for_group(con.deref_mut(), group_id).await?;
            let mut teachers_map: BTreeMap<i32, (TeacherModel, Vec<String>)> = BTreeMap::new();
            for teacher in teachers {
                let teacher_departments =
                    models::teachers::get_teacher_departments(teacher.teacher_id, &mut *con)
                        .await?;
                teachers_map.insert(teacher.teacher_id, (teacher, teacher_departments));
            }

            if let Some(channel) = MERGE_REQUEST_CHANNEL.get() {
                //check if it is full
                if channel.try_send(group_id).is_err() {
                    warn!(
                        "Channel is full, skipping merge request for group {}",
                        group_id
                    );
                } else {
                    MERGE_REQUEST_CNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
            }

            let output_objs: Vec<OutputScheduleObjectModel> = sched_objects
                .into_iter()
                .map(|s| (s, &subjects_map, &teachers_map).try_into().unwrap())
                .collect();
            let output = OutputGroupScheduleModel {
                sched_objs: output_objs,
                is_ready: true,
                actual_time: Some(time),
            };

            GetGroupScheduleObjectsRes::success(output)
        }
        None => {
            warn!("Group {} is not yet ready!", group_id);
            if let Some(channel) = MERGE_REQUEST_CHANNEL.get() {
                //check if it is full
                if channel.try_send(group_id).is_err() {
                    warn!(
                        "Channel is full, skipping merge request for group {}",
                        group_id
                    );
                } else {
                    MERGE_REQUEST_CNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
            }

            let output = OutputGroupScheduleModel {
                sched_objs: Vec::new(),
                is_ready: false,
                actual_time: None,
            };

            GetGroupScheduleObjectsRes::success(output)
        }
    }
}

type GetGroupsRes = ResponderWithSuccess<BTreeMap<i32, GroupModel>>;

#[get("/groups")]
async fn get_groups(mut con: Connection<Db>) -> GetGroupsRes {
    let groups = models::groups::get_groups(con.deref_mut()).await?;
    let mut out_groups = BTreeMap::new();
    for g in groups.into_iter() {
        out_groups.insert(g.group_id, g);
    }
    GetGroupsRes::success(out_groups)
}

#[get("/semester")]
async fn semester_info() -> ResponderWithSuccess<SemesterInfo> {
    let semester_info = api::etu_attendance_api::get_semester_info().await?;
    ResponderWithSuccess::success(semester_info)
}

pub fn get_routes() -> Vec<Route> {
    routes![get_group_schedule_objects, get_groups, semester_info]
}
