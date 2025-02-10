use anyhow::Context;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::time::Duration;

use crate::models::groups::{DepartmentModel, FacultyModel, GroupModel};
use crate::models::schedule::{ScheduleObjModel, ScheduleObjModelNormalized, WeekDay};
use crate::models::subjects::SubjectModel;
use crate::models::teachers::TeacherModel;

use itertools::Itertools;
use rocket::time::PrimitiveDateTime;

const BASE_URL_SCHEDULE: &str = "https://digital.etu.ru/api/schedule/";
const BASE_URL_GENERAL: &str = "https://digital.etu.ru/api/general/";

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FacultyOriginal {
    pub id: i32,
    pub title: String,
}

impl FacultyOriginal {
    pub fn as_model(&self) -> FacultyModel {
        FacultyModel {
            faculty_id: self.id,
            title: self.title.clone(),
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectDepartmentOriginal {
    pub id: i32,
    pub title: String,
    pub long_title: Option<String>,
    #[serde(rename = "type")]
    pub _type: String,
}

impl From<SubjectDepartmentOriginal> for DepartmentModel {
    fn from(other: SubjectDepartmentOriginal) -> DepartmentModel {
        DepartmentModel {
            department_id: other.id,
            title: other.title,
            long_title: other.long_title,
            department_type: other._type,
            faculty_id: None,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentOriginal {
    pub id: i32,
    pub title: String,
    pub long_title: Option<String>,
    #[serde(rename = "type")]
    pub _type: String,
    pub faculty: FacultyOriginal,
}

impl DepartmentOriginal {
    pub fn as_model(&self) -> DepartmentModel {
        DepartmentModel {
            department_id: self.id,
            title: self.title.clone(),
            long_title: self.long_title.clone(),
            department_type: self._type.clone(),
            faculty_id: Some(self.faculty.id),
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupOriginal {
    pub full_number: String,
    pub id: i32,
    pub number: String,
    pub studying_type: String,
    pub education_level: String,
    pub department_id: i32,
    pub specialty_id: i32,
    pub start_year: i32,
    pub end_year: i32,
    pub department: DepartmentOriginal,
}

impl GroupOriginal {
    pub fn as_model(&self) -> GroupModel {
        GroupModel {
            group_id: self.id,
            number: self.number.clone(),
            studying_type: self.studying_type.clone(),
            education_level: self.education_level.clone(),
            start_year: self.start_year,
            end_year: self.end_year,
            department_id: self.department_id,
            specialty_id: self.specialty_id,

            // missing info:
            latest_schedule_merge_timestamp: None,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReservationTimeOriginal {
    id: i32,
    start_time: i32,
    end_time: i32,
    week: String,
    week_day: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditoriumReservationOriginal {
    id: u32,
    auditorium_number: Option<String>,
    description: String,
    #[serde(rename = "type")]
    _type: String,
    reservation_time: ReservationTimeOriginal,
    updated_at: Option<String>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectOriginal {
    pub id: i32,
    pub alien_id: i32,
    pub title: String,
    pub short_title: String,
    pub subject_type: String,
    pub control_type: Option<String>,
    pub department: SubjectDepartmentOriginal,
    pub semester: i32,
}

impl Into<SubjectModel> for SubjectOriginal {
    fn into(self) -> SubjectModel {
        SubjectModel {
            subject_id: self.id,
            title: self.title,
            short_title: self.short_title,
            alien_id: self.alien_id,
            subject_type: self.subject_type,
            control_type: self.control_type,
            department_id: self.department.id,
            semester: self.semester,

            // missing info
            subject_obj_id: Default::default(),
            gen_start: Default::default(),
            gen_end: Default::default(),
            existence_diff: Default::default(),
            created_timestamp: PrimitiveDateTime::MIN,
            modified_timestamp: PrimitiveDateTime::MIN,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TeacherOriginal {
    id: i32,

    name: String,
    surname: String,
    midname: String,
    initials: String,

    birthday: Option<String>,
    email: Option<String>,
    group_id: Option<i32>,

    rank: Option<String>,
    position: Option<String>,
    degree: Option<String>,
    roles: Vec<String>,
    work_departments: Option<Vec<String>>,
}

impl Into<(TeacherModel, Vec<String>)> for TeacherOriginal {
    fn into(self) -> (TeacherModel, Vec<String>) {
        let fixed_birthday = self.birthday.map(|birthday| birthday.rsplit("-").join("-"));

        let is_worker = self.roles.contains(&"worker".to_string());
        let is_student = self.roles.contains(&"student".to_string());
        let is_department_head = self.roles.contains(&"departmentHead".to_string());
        let is_department_dispatcher = self.roles.contains(&"departmentDispatcher".to_string());
        let teacher = TeacherModel {
            teacher_id: self.id,
            initials: self.initials,
            name: self.name,
            surname: self.surname,
            midname: self.midname,
            birthday: fixed_birthday,
            email: self.email,
            group_id: self.group_id,
            is_worker,
            is_department_head,
            is_department_dispatcher,
            is_student,
            position: self.position.clone(),
            degree: self.degree.clone(),
            rank: self.rank.clone(),

            // db stuff
            gen_end: Default::default(),
            gen_start: Default::default(),
            teacher_obj_id: Default::default(),
            existence_diff: Default::default(),

            created_timestamp: PrimitiveDateTime::MIN,
            modified_timestamp: PrimitiveDateTime::MIN,
        };
        let work_departments = self.work_departments.unwrap_or_default();

        (teacher, work_departments)
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LessonOriginal {
    pub id: i32,
    pub auditorium_reservation: AuditoriumReservationOriginal,
    pub subject: SubjectOriginal,
    pub teacher: Option<TeacherOriginal>,
    pub second_teacher: Option<TeacherOriginal>,
    // not included in original response
    pub combined_teachers: Option<Vec<TeacherOriginal>>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ScheduleObjectOriginal {
    pub id: i32,
    pub lesson: LessonOriginal,
}

impl TryInto<ScheduleObjModelNormalized> for ScheduleObjectOriginal {
    type Error = String;
    fn try_into(self) -> Result<ScheduleObjModelNormalized, String> {
        Ok(ScheduleObjModelNormalized {
            schedule_object: ScheduleObjModel {
                last_known_orig_sched_obj_id: self.id,
                subject_id: self.lesson.subject.id,
                auditorium: self.lesson.auditorium_reservation.auditorium_number.clone(),
                time: self
                    .lesson
                    .auditorium_reservation
                    .reservation_time
                    .start_time,
                week_day: WeekDay::try_from(
                    self.lesson
                        .auditorium_reservation
                        .reservation_time
                        .week_day
                        .clone(),
                )
                .map_err(|_| "Cannot parse week day!".to_string())?,
                week_parity: self
                    .lesson
                    .auditorium_reservation
                    .reservation_time
                    .week
                    .clone(),

                // unrelated info
                subject_gen_id: Default::default(),
                teacher_gen_id: Default::default(),
                schedule_obj_id: Default::default(), // db id
                time_link_id: Default::default(),
                group_id: Default::default(), // known from outside
                gen_start: Default::default(),
                gen_end: Default::default(),
                existence_diff: Default::default(),
                prev_time_link_id: Default::default(),

                created_timestamp: PrimitiveDateTime::MIN,
                modified_timestamp: PrimitiveDateTime::MIN,
            },
            teachers: self
                .lesson
                .combined_teachers
                .map(|t| t.into_iter().map(|t| t.id).collect::<Vec<i32>>())
                .unwrap_or_else(|| {
                    vec![
                        self.lesson.teacher.map(|s| s.id),
                        self.lesson.second_teacher.map(|s| s.id),
                    ]
                    .into_iter()
                    .flatten()
                    .collect()
                }),
        })
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GroupScheduleOriginal {
    pub schedule_objects: Vec<ScheduleObjectOriginal>,
    #[serde(rename = "id")]
    pub group_id: i32,
}

pub async fn get_schedule_objs_group(group: u32) -> anyhow::Result<Option<GroupScheduleOriginal>> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&groups={}",
        BASE_URL_SCHEDULE,
        group
    );
    let response = reqwest::Client::new()
        .get(&url)
        .timeout(Duration::from_secs(5))
        .send()
        .await?;
    let body = response.text().await?;

    let parsed_objs = parse_schedule_objs_groups(body)?;
    Ok(parsed_objs.first().cloned())
}

pub async fn get_schedule_objs_groups(
    groups: Vec<i32>,
) -> anyhow::Result<BTreeMap<i32, GroupScheduleOriginal>> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&{}",
        BASE_URL_SCHEDULE,
        groups.iter().map(|g| "groups=".to_string()+&g.to_string()).collect::<Vec<String>>().join("&")
    );
    let response = reqwest::Client::new()
        .get(&url)
        .timeout(Duration::from_secs(5))
        .send()
        .await?;
    let body = response.text().await?;

    let parsed_objs = parse_schedule_objs_groups(body).context("parsing schedule objs")?;
    let res = parsed_objs
        .into_iter()
        .map(|g| (g.group_id, g))
        .collect::<BTreeMap<i32, GroupScheduleOriginal>>();

    Ok(res)
}

fn parse_schedule_objs_groups(data: String) -> anyhow::Result<Vec<GroupScheduleOriginal>> {
    let sched_objs: Vec<GroupScheduleOriginal> = serde_json::from_str(&data)?;

    let mut res = Vec::<GroupScheduleOriginal>::new();

    // preprocessing: merge same auditoriums
    // 1) by group
    for group_schedule in sched_objs.iter() {
        trace!("Parsing group {}", group_schedule.group_id);
        let mut group_schedule_res = GroupScheduleOriginal {
            schedule_objects: Vec::new(),
            group_id: group_schedule.group_id,
        };

        // 2) by subject and placement
        let mut unique_subject_positions =
            BTreeMap::<(i32, WeekDay, String, i32), Vec<ScheduleObjectOriginal>>::new();
        for schedule_obj in &group_schedule.schedule_objects {
            // 3) subdivide start/end time
            for time in (schedule_obj
                .lesson
                .auditorium_reservation
                .reservation_time
                .start_time
                % 10)
                ..(schedule_obj
                    .lesson
                    .auditorium_reservation
                    .reservation_time
                    .end_time
                    % 10
                    + 1)
            {
                let mut sched_obj_clone = schedule_obj.clone();
                sched_obj_clone
                    .lesson
                    .auditorium_reservation
                    .reservation_time
                    .start_time = time;
                sched_obj_clone
                    .lesson
                    .auditorium_reservation
                    .reservation_time
                    .end_time = time;

                unique_subject_positions
                    .entry((
                        schedule_obj.lesson.subject.id,
                        WeekDay::try_from(
                            schedule_obj
                                .lesson
                                .auditorium_reservation
                                .reservation_time
                                .week_day
                                .clone(),
                        )
                        .unwrap(),
                        schedule_obj
                            .lesson
                            .auditorium_reservation
                            .reservation_time
                            .week
                            .clone(),
                        time,
                    ))
                    .or_default()
                    .push(sched_obj_clone);
            }
        }

        //check uniqueness
        for (_, uniq_placement_elements) in unique_subject_positions.iter_mut() {
            if uniq_placement_elements.len() > 1 {
                //merge
                debug!(
                    "During parse sched objs for group id {}...",
                    group_schedule.group_id
                );
                debug!("Found more than one schedule object for subject at single time placement");
                debug!(
                    "\tsubject_id: {}",
                    uniq_placement_elements[0].lesson.subject.id
                );
                debug!(
                    "\tweek_parity: {}",
                    uniq_placement_elements[0]
                        .lesson
                        .auditorium_reservation
                        .reservation_time
                        .week
                );
                debug!(
                    "\tweek_day: {}",
                    uniq_placement_elements[0]
                        .lesson
                        .auditorium_reservation
                        .reservation_time
                        .week_day
                );
                debug!(
                    "\ttime: {}",
                    uniq_placement_elements[0]
                        .lesson
                        .auditorium_reservation
                        .reservation_time
                        .start_time
                );

                let mut auditoriums = Vec::new();
                let mut teachers = Vec::new();

                // ensure everything is the same except auditorium and teacher
                for i in 0..uniq_placement_elements.len() {
                    if let Some(auditorium) = uniq_placement_elements[i]
                        .lesson
                        .auditorium_reservation
                        .auditorium_number
                        .clone()
                    {
                        auditoriums.push(auditorium);
                    }

                    if let Some(teacher) = uniq_placement_elements[i].lesson.teacher.clone() {
                        teachers.push(teacher);
                    }

                    if let Some(teacher) = uniq_placement_elements[i].lesson.second_teacher.clone()
                    {
                        teachers.push(teacher);
                    }
                }

                if auditoriums.is_empty() {
                    uniq_placement_elements[0]
                        .lesson
                        .auditorium_reservation
                        .auditorium_number = None;
                } else {
                    uniq_placement_elements[0]
                        .lesson
                        .auditorium_reservation
                        .auditorium_number = Some(auditoriums.join(", "));
                }

                uniq_placement_elements[0].lesson.combined_teachers = Some(teachers);
                group_schedule_res
                    .schedule_objects
                    .push(uniq_placement_elements[0].clone());
            } else {
                group_schedule_res
                    .schedule_objects
                    .push(uniq_placement_elements[0].clone());
            }
        }

        res.push(group_schedule_res);
    }
    Ok(res)
}

pub async fn get_groups_list() -> anyhow::Result<Vec<GroupOriginal>> {
    let url = format!(
        "{}dicts/groups?scheduleId=publicated&withFaculty=true&withSemesterSeasons=false&withFlows=false",
        BASE_URL_GENERAL
    );
    let response = reqwest::Client::new()
        .get(&url)
        .timeout(Duration::from_secs(5))
        .send()
        .await?;
    let body = response.text().await?;

    parse_groups(body)
}

fn parse_groups(data: String) -> anyhow::Result<Vec<GroupOriginal>> {
    let input_data: Vec<GroupOriginal> = serde_json::from_str(&data)?;

    Ok(input_data)
}

#[cfg(test)]
mod tests {
    use crate::api::etu_api::{parse_groups, parse_schedule_objs_groups};

    #[test]
    fn parse_groups_wrong_format() -> anyhow::Result<()> {
        let groups = String::from("[{}]");

        if parse_groups(groups).is_err() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Error"))
        }
    }

    #[test]
    fn parse_groups_test() -> anyhow::Result<()> {
        // load from file "groups_response_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/groups_response_test.txt")?;

        let res = parse_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
    #[test]
    fn parse_schedule_very_big_test() -> anyhow::Result<()> {
        // load from file "whole_semester_schedule_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/whole_semester_schedule_test.txt")?;

        let res = parse_schedule_objs_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
    #[test]
    fn parse_schedule_0303_test() -> anyhow::Result<()> {
        // load from file "0303_schedule_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/0303_schedule_test.txt")?;

        let res = parse_schedule_objs_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
}
