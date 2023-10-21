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
    let url = format!("{}dicts/groups?scheduleId=publicated&withFaculty=false&withSemesterSeasons=false&withFlows=false", BASE_URL_GENERAL);
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
