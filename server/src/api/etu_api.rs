use std::collections::HashMap;

use rocket::serde::json::{Json, Value};
use serde::{Deserialize, Serialize};

const BASE_URL_SCHEDULE: &str = "https://digital.etu.ru/api/schedule/";
const BASE_URL_ATTENDANCE: &str = "https://digital.etu.ru/api/attendance/";
const BASE_URL_GENERAL: &str = "https://digital.etu.ru/api/general/";

#[derive(Deserialize, Debug)]
struct Input {
    fullNumber: String,
    id: usize,
    number: String,
    course: usize,
    studyingType: String,
    educationLevel: String,
    departmentId: usize,
    specialtyId: usize,
}

#[derive(Serialize, Debug)]
struct Output {
    fullNumber: String,
    number: String,
    course: usize,
    studyingType: String,
    educationLevel: String,
    departmentId: usize,
    specialtyId: usize,
}

pub async fn get_schedule_objs_group(group: usize) -> Json<Value> {
    let url = format!(
        "{}objects/594?withSubjectCode=true&withURL=true&groups={}",
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

    let input_data = serde_json::from_str::<Vec<Input>>(&body).unwrap();
    let mut output_data = HashMap::new();

    for item in input_data {
        let output = Output {
            fullNumber: item.fullNumber,
            number: item.number,
            course: item.course,
            studyingType: item.studyingType,
            educationLevel: item.educationLevel,
            departmentId: item.departmentId,
            specialtyId: item.specialtyId,
        };
        output_data.insert(item.id.to_string(), output);
    }

    let value = serde_json::to_value(output_data).unwrap();
    Json(value)
}

