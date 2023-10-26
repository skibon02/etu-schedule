use std::collections::HashMap;

use rocket::serde::json::{Json, Value};
use serde::{Deserialize, Serialize};

use crate::models::groups::GroupsModel;

const BASE_URL_SCHEDULE: &str = "https://digital.etu.ru/api/schedule/";
const BASE_URL_ATTENDANCE: &str = "https://digital.etu.ru/api/attendance/";
const BASE_URL_GENERAL: &str = "https://digital.etu.ru/api/general/";

#[derive(Deserialize, Debug)]
struct GroupsOriginal {
    fullNumber: String,
    id: u32,
    number: String,
    studyingType: String,
    educationLevel: String,
    departmentId: u32,
    specialtyId: u32,
    startYear: u16,
    endYear: u16,
}

pub async fn get_schedule_objs_group(group: usize) -> Json<Value> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&groups={}",
        BASE_URL_SCHEDULE,
        group
    );
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();
    let value: Value = serde_json::from_str(&body).unwrap();
    Json(value)
}

pub async fn get_groups_list() -> Json<Value> {
    let url = format!("{}dicts/groups?scheduleId=594&withFaculty=false&withSemesterSeasons=false&withFlows=false", BASE_URL_GENERAL);
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    let input_data = serde_json::from_str::<Vec<GroupsOriginal>>(&body).unwrap();
    let mut output_data = HashMap::new();

    for item in input_data {
        let output = GroupsModel {
            group_id: item.id,
            number: item.number,
            studying_type: item.studyingType,
            education_level: item.educationLevel,
            start_year: item.startYear,
            end_year: item.endYear,
            department_id: item.departmentId,
            specialty_id: item.specialtyId,
        };
        output_data.insert(item.id.to_string(), output);
    }

    let value = serde_json::to_value(output_data).unwrap();
    Json(value)
}

