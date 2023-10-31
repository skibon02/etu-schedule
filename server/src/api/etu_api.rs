use std::collections::{HashMap, BTreeMap};

use rocket::serde::json::{Json, Value};
use serde::{Deserialize, Serialize};

use crate::models::groups::{DepartmentModel, FacultyModel, GroupModel};

const BASE_URL_SCHEDULE: &str = "https://digital.etu.ru/api/schedule/";
const BASE_URL_ATTENDANCE: &str = "https://digital.etu.ru/api/attendance/";
const BASE_URL_GENERAL: &str = "https://digital.etu.ru/api/general/";

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FacultyOriginal {
    pub id: u32,
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
pub struct DepartmentOriginal {
    pub id: u32,
    pub title: String,
    pub longTitle: String,
    #[serde(rename = "type")]
    pub _type: String,
    pub faculty: FacultyOriginal
}

impl DepartmentOriginal {
    pub fn as_model(&self) -> DepartmentModel {
        DepartmentModel {
            department_id: self.id,
            title: self.title.clone(),
            long_title: self.longTitle.clone(),
            department_type: self._type.clone(),
            faculty_id: self.faculty.id,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct GroupOriginal {
    pub fullNumber: String,
    pub id: u32,
    pub number: String,
    pub studyingType: String,
    pub educationLevel: String,
    pub departmentId: u32,
    pub specialtyId: u32,
    pub startYear: u16,
    pub endYear: u16,
    pub department: DepartmentOriginal
}

impl GroupOriginal {
    pub fn as_model(&self) -> GroupModel {
        GroupModel {
            group_id: self.id,
            number: self.number.clone(),
            studying_type: self.studyingType.clone(),
            education_level: self.educationLevel.clone(),
            start_year: self.startYear,
            end_year: self.endYear,
            department_id: self.departmentId,
            specialty_id: self.specialtyId,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ReservationTimeOriginal {
    id: u32,
    startTime: u32,
    endTime: u32,
    week: String,
    weekDay: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct AuditoriumOriginal {
    displayName: String,
    number: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct AuditoriumReservationOriginal {
    id: u32,
    auditoriumNumber: Option<String>,
    auditorium: Option<AuditoriumOriginal>,
    description: String,
    #[serde(rename = "type")]
    _type: String,
    reservationTime: ReservationTimeOriginal,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct SubjectOriginal {
    id: u32,
    alienId: i32,
    title: String,
    shortTitle: String,
    subjectType: String,
    controlType: Option<String>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct TeacherOriginal {
    id: u32,

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

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct LessonOriginal {
    id: u32,
    auditoriumReservation: AuditoriumReservationOriginal,
    subject: SubjectOriginal,
    teacher: Option<TeacherOriginal>,
    secondTeacher: Option<TeacherOriginal>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ScheduleObjectOriginal {
    id: u32,
    lesson: LessonOriginal,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct GroupScheduleOriginal {
    pub scheduleObjects: Vec<ScheduleObjectOriginal>,
}

pub async fn get_schedule_objs_group(group: usize) -> Vec<GroupScheduleOriginal> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&groups={}",
        BASE_URL_SCHEDULE,
        group
    );
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    parse_schedule_objs_group(body).unwrap()
}

fn parse_schedule_objs_group(data: String) -> anyhow::Result<Vec<GroupScheduleOriginal>> {
    let value: Vec<GroupScheduleOriginal> = serde_json::from_str(&data)?;
    Ok(value)
}

pub async fn get_groups_list() -> Vec<GroupOriginal> {
    let url = format!("{}dicts/groups?scheduleId=594&withFaculty=true&withSemesterSeasons=false&withFlows=false", BASE_URL_GENERAL);
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    parse_groups(body).unwrap()
}

fn parse_groups(data: String) -> anyhow::Result<Vec<GroupOriginal>> {
    let input_data: Vec<GroupOriginal> = serde_json::from_str(&data)?;

    Ok(input_data)
}




#[cfg(test)]
mod tests {
    use crate::api::etu_api::{parse_groups, parse_schedule_objs_group};

    #[test]
    fn parse_groups_wrong_format() -> anyhow::Result<()> {
        let groups = String::from( "[{}]");

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

        let res = parse_schedule_objs_group(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
    #[test]
    fn parse_schedule_0303_test() -> anyhow::Result<()> {
        // load from file "0303_schedule_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/0303_schedule_test.txt")?;

        let res = parse_schedule_objs_group(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
}