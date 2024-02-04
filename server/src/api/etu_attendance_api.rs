use std::fmt::Debug;
use std::time::Duration;

use anyhow::Context;
use reqwest::Response;

use serde_json::Value;

#[derive(serde::Deserialize, Debug)]
pub struct TimeResponse {
    pub time: String,
    pub week: i32,
}

fn route(query: &str) -> String {
    format!("https://digital.etu.ru/attendance/api/{}", query)
}
pub async fn get_time() -> anyhow::Result<TimeResponse> {
    let response: Response = reqwest::Client::new()
        .get(route("settings/time"))
        .timeout(Duration::from_secs(1))
        .send()
        .await?;

    let result: TimeResponse = response.json().await?;
    Ok(result)
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LessonResponse {
    pub id: i32,
    pub title: String,
    pub short_title: String,
    pub subject_type: String,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TeacherResponse {
    pub id: i32,
    pub name: String,
    pub surname: String,
    pub midname: String,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LessonInstanceResponse {
    pub id: i32,
    pub start: String,
    pub end: String,
    pub is_distant: bool,
    pub room: Option<String>,
    pub lesson: LessonResponse,
    pub teachers: Vec<TeacherResponse>,

    pub self_reported: Option<bool>,
    pub group_leader_reported: Option<bool>,
    pub teacher_reported: Option<bool>,
    pub is_group_leader: bool,
    pub check_in_start: String,
    pub check_in_deadline: String,
}

#[derive(Debug)]
pub enum GetScheduleResult {
    Ok(Vec<LessonInstanceResponse>),
    WrongToken,
}

pub async fn get_cur_schedule(token: String) -> anyhow::Result<GetScheduleResult> {
    let response: Response = reqwest::Client::new()
        .get(route("schedule/check-in"))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .timeout(Duration::from_secs(1))
        .send()
        .await
        .context("Cannot make fetch to schedule from etu attendance")?;

    info!("Result code: {:?}", response.status().as_u16());

    if response.status().is_success() {
        let result: Vec<LessonInstanceResponse> = response.json().await.context("Cannot parse get_cur_schedule result with success code as LessonInstanceResponse json!")?;
        Ok(GetScheduleResult::Ok(result))
    } else {
        warn!(
            "Cannot get schedule: status code: {:?}",
            response.status().as_str()
        );

        if response.status().as_u16() == 401 {
            return Ok(GetScheduleResult::WrongToken);
        }

        let result: Value = response
            .json()
            .await
            .context("Cannot parse get_cur_schedule response as json")?;
        if let Ok(result) = serde_json::from_value::<AttendanceCheckInResponseError>(result.clone())
        {
            match result.message.as_str() {
                _ => unimplemented!("Cannot parse error: {:?}", result),
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

pub async fn check_in(token: String, lesson_instance_id: i32) -> anyhow::Result<CheckInResult> {
    let response = reqwest::Client::new()
        .post(route(&format!("schedule/check-in/{}", lesson_instance_id)))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .timeout(Duration::from_secs(1))
        .send()
        .await
        .context("Failed to perform check_in request to schedule api!")?;

    let err_code = response.status().as_u16();
    if response.status().is_success() {
        let result: AttendanceCheckInResponse = response
            .json()
            .await
            .context("Cannot parse check_in result with success code as json!")?;
        if result.ok {
            Ok(CheckInResult::Ok)
        } else {
            Err(anyhow::anyhow!("Cannot make check-in: ok is not true!"))
        }
    } else {
        warn!(
            "Cannot make check-in: status code: {:?}",
            response.status().as_str()
        );

        if err_code == 401 {
            return Ok(CheckInResult::WrongToken);
        }

        let result: Value = response
            .json()
            .await
            .context("Cannot parse check_in response as json")?;
        if let Ok(result) = serde_json::from_value::<AttendanceCheckInResponseError>(result.clone())
        {
            match result.message.as_str() {
                "Время для отметки истекло" => Ok(CheckInResult::TooLate),
                "Время для отметки ещё не наступило" => {
                    Ok(CheckInResult::TooEarly)
                }
                "Не найдено" => Err(anyhow::anyhow!(
                    "Cannot make check-in: lesson instance was not found!"
                )),
                _ => unimplemented!("Cannot parse error: {:?}", result),
            }
        } else {
            unimplemented!("Cannot parse error: {:?}", result)
        }
    }
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserGroupResponse {
    pub role: String,
    pub status: String,
    pub is_new: bool,
    pub group_id: i32,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GroupResponse {
    pub name: String,
    pub is_fake: bool,
    pub study_level: String,
    pub study_form: String,
    pub user_group: UserGroupResponse,
}

#[derive(serde::Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub initials: String,
    pub id: i32,
    pub surname: String,
    pub name: String,
    pub midname: String,
    pub email: String,
    pub lk_id: i32,
    pub roles: Vec<String>,
    pub personal_number: String,
    pub birthday: String,
    pub created_at: String,
    pub updated_at: String,
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
pub async fn get_current_user(token: String) -> anyhow::Result<GetCurrentUserResult> {
    let response: Response = reqwest::Client::new()
        .get(route("auth/current-user"))
        .header("Cookie", format!("connect.digital-attendance={}", token))
        .timeout(Duration::from_secs(1))
        .send()
        .await
        .context("Cannot make fetch to current user from etu attendance")?;

    let _status_code = response.status().as_u16();

    let result: CurrentUserResponse = response
        .json()
        .await
        .context("Cannot parse get_current_user result with success code as json!")?;
    if let Some(result) = result.user {
        Ok(GetCurrentUserResult::Ok(result))
    } else {
        Ok(GetCurrentUserResult::WrongToken)
    }
}

#[derive(serde::Deserialize, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SemesterInfo {
    pub id: i32,
    pub season: String,
    pub year: i32,
    pub start_date: String,
    pub end_date: String,
    pub current_date: String,
}

pub async fn get_semester_info() -> anyhow::Result<SemesterInfo> {
    let response: Response = reqwest::Client::new()
        .get(route("schedule/semester"))
        .timeout(Duration::from_secs(1))
        .send()
        .await?;

    let result: SemesterInfo = response.json().await?;
    Ok(result)
}
