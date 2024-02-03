use std::fmt::Debug;
use std::ops::FromResidual;
use anyhow::Context;
use reqwest::Response;
use rocket::serde::json::Json;
use serde_json::Value;
use crate::models::DbResult;

#[derive(serde::Deserialize, Debug)]
pub struct TimeResponse {
    pub time: String,
    pub week: i32,
}

fn route(query: &str) -> String {
    format!("https://digital.etu.ru/attendance/api/{}", query)
}
pub async fn get_time() -> DbResult<TimeResponse> {
    let response: Response = reqwest::Client::new()
        .get(route("settings/time"))
        .send()
        .await?;

    let result: TimeResponse = response.json().await?;
    Ok(result)
}

#[derive(serde::Deserialize, Debug)]
pub struct LessonResponse {
    pub id: i32,
    pub title: String,
    pub shortTitle: String,
    pub subjectType: String,
}

#[derive(serde::Deserialize, Debug)]
pub struct TeacherResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub midname: String,
}

#[derive(serde::Deserialize, Debug)]
pub struct LessonInstanceResponse {
    pub id: i32,
    pub start: String,
    pub end: String,
    pub isDistant: bool,
    pub room: Option<String>,
    pub lesson: LessonResponse,
    pub teachers: Vec<TeacherResponse>,

    pub selfReported: Option<bool>,
    pub groupLeaderReported: Option<bool>,
    pub teacherReported: Option<bool>,
    pub isGroupLeader: bool,
    pub checkInStart: String,
    pub checkInDeadline: String,
}

#[derive(Debug)]
pub enum GetScheduleResult {
    Ok(Vec<LessonInstanceResponse>),
    WrongToken,
}

pub async fn get_cur_schedule(token: String) -> DbResult<GetScheduleResult> {
    let response: Response = reqwest::Client::new()
        .get(route("schedule/check-in"))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .send()
        .await.context("Cannot make fetch to schedule from etu attendance")?;

    info!("Result code: {:?}", response.status().as_u16());

    if response.status().is_success() {
        let result: Vec<LessonInstanceResponse> = response.json().await.context("Cannot parse get_cur_schedule result with success code as LessonInstanceResponse json!")?;
        Ok(GetScheduleResult::Ok(result))
    }
    else {
        warn!("Cannot get schedule: status code: {:?}", response.status().as_str());

        if response.status().as_u16() == 401 {
            return Ok(GetScheduleResult::WrongToken);
        }

        let result: Value = response.json().await.context("Cannot parse get_cur_schedule response as json")?;
        if let Ok(result) = serde_json::from_value::<AttendanceCheckInResponseError>(result.clone()) {
            match result.message.as_str() {
                _ => unimplemented!("Cannot parse error: {:?}", result)
            }
        } else {
            unimplemented!("Cannot parse error: {:?}", result)
        }
    }
}

#[derive(serde::Deserialize, Debug)]
pub struct AttendanceCheckInResponse {
    pub ok: bool,
}
#[derive(serde::Deserialize, Debug)]
pub struct AttendanceCheckInResponseError {
    pub message: String,
}

#[derive(Debug)]
pub enum CheckInResult {
    Ok,
    TooEarly,
    TooLate,
    WrongToken,
}

pub async fn check_in(token: String, lesson_instance_id: i32) -> DbResult<CheckInResult> {
    let response = reqwest::Client::new()
        .post(route(&format!("schedule/check-in/{}", lesson_instance_id)))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .send()
        .await.context("Failed to perform check_in request to schedule api!")?;

    let err_code = response.status().as_u16();
    if response.status().is_success() {
        let result: AttendanceCheckInResponse = response.json().await.context("Cannot parse check_in result with success code as json!")?;
        if result.ok {
            Ok(CheckInResult::Ok)
        } else {
            Err(anyhow::anyhow!("Cannot make check-in: ok is not true!"))
        }
    } else {
        warn!("Cannot make check-in: status code: {:?}", response.status().as_str());

        if err_code == 401 {
            return Ok(CheckInResult::WrongToken);
        }

        let result: Value = response.json().await.context("Cannot parse check_in response as json")?;
        if let Ok(result) = serde_json::from_value::<AttendanceCheckInResponseError>(result.clone()) {
            match result.message.as_str() {
                "Время для отметки истекло" => Ok(CheckInResult::TooLate),
                "Время для отметки ещё не наступило" => Ok(CheckInResult::TooEarly),
                "Не найдено" => Err(anyhow::anyhow!("Cannot make check-in: lesson instance was not found!")),
                _ => unimplemented!("Cannot parse error: {:?}", result)
            }
        } else {
            unimplemented!("Cannot parse error: {:?}", result)
        }
    }
}

#[derive(serde::Deserialize, Debug)]
pub struct UserGroupResponse {
    pub role: String,
    pub status: String,
    pub isNew: bool,
    pub groupId: i32,
}

#[derive(serde::Deserialize, Debug)]
pub struct GroupResponse {
    pub name: String,
    pub isFake: bool,
    pub studyLevel: String,
    pub studyForm: String,
    pub UserGroup: UserGroupResponse,
}

#[derive(serde::Deserialize, Debug)]
pub struct UserResponse {
    pub initials: String,
    pub id: i32,
    pub surname: String,
    pub name: String,
    pub midname: String,
    pub email: String,
    pub lkId: i32,
    pub roles: Vec<String>,
    pub personalNumber: String,
    pub birthday: String,
    pub createdAt: String,
    pub updatedAt: String,
    pub groups: Vec<GroupResponse>,
    pub curated: Vec<Value>,
    pub departments: Vec<Value>,
    pub faculties: Vec<Value>,
}

#[derive(serde::Deserialize, Debug)]
pub struct CurrentUserResponse {
    pub user: Option<UserResponse>,
}

pub enum GetCurrentUserResult {
    Ok(UserResponse),
    WrongToken,
}
pub async fn get_current_user(token: String) -> DbResult<GetCurrentUserResult> {
    let response: Response = reqwest::Client::new()
        .get(route("auth/current-user"))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .send()
        .await.context("Cannot make fetch to current user from etu attendance")?;

    let status_code = response.status().as_u16();

    let result: CurrentUserResponse = response.json().await.context("Cannot parse get_current_user result with success code as json!")?;
    if let Some(result) = result.user {
        Ok(GetCurrentUserResult::Ok(result))
    }
    else {
        Ok(GetCurrentUserResult::WrongToken)
    }
}