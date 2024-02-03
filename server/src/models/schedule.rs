use anyhow::Context;
use rocket::serde::json::Json;
use rocket::time::PrimitiveDateTime;
use rocket_db_pools::Connection;
use sqlx::{Acquire, PgConnection, Postgres};
use sqlx::pool::PoolConnection;
use crate::models;
use crate::models::{Db, DbResult};
use crate::routes::ResponseErrorMessage;

#[derive(sqlx::Type, Default, Debug, Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
#[sqlx(type_name="week_day", rename_all="UPPERCASE")]
pub enum WeekDay {
    #[default]
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
    Sun
}

impl WeekDay {
    pub fn as_num(&self) -> u8 {
        match self {
            WeekDay::Mon => 0,
            WeekDay::Tue => 1,
            WeekDay::Wed => 2,
            WeekDay::Thu => 3,
            WeekDay::Fri => 4,
            WeekDay::Sat => 5,
            WeekDay::Sun => 6
        }
    }
    pub fn to_string(self) -> String {
        self.into()
    }
}

impl TryFrom<String> for WeekDay {
    type Error = ();
    fn try_from(value: String) -> Result<Self, Self::Error> {
        match value.as_str() {
            "MON" => Ok(WeekDay::Mon),
            "TUE" => Ok(WeekDay::Tue),
            "WED" => Ok(WeekDay::Wed),
            "THU" => Ok(WeekDay::Thu),
            "FRI" => Ok(WeekDay::Fri),
            "SAT" => Ok(WeekDay::Sat),
            "SUN" => Ok(WeekDay::Sun),
            _ => Err(())
        }
    }
}


impl TryFrom<u32> for WeekDay {
    type Error = ();
    fn try_from(value: u32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(WeekDay::Mon),
            1 => Ok(WeekDay::Tue),
            2 => Ok(WeekDay::Wed),
            3 => Ok(WeekDay::Thu),
            4 => Ok(WeekDay::Fri),
            5 => Ok(WeekDay::Sat),
            6 => Ok(WeekDay::Sun),
            _ => Err(())
        }
    }
}

impl Into<String> for WeekDay {
    fn into(self) -> String {
        match self {
            WeekDay::Mon => "MON".to_string(),
            WeekDay::Tue => "TUE".to_string(),
            WeekDay::Wed => "WED".to_string(),
            WeekDay::Thu => "THU".to_string(),
            WeekDay::Fri => "FRI".to_string(),
            WeekDay::Sat => "SAT".to_string(),
            WeekDay::Sun => "SUN".to_string(),
        }
    }
}

#[derive(sqlx::FromRow, Debug, Clone)]
pub struct ScheduleObjModel {
    pub schedule_obj_id: i32,

    pub last_known_orig_sched_obj_id: i32,

    pub group_id: i32,
    pub time_link_id: i32,
    pub prev_time_link_id: Option<i32>,


    pub subject_id: i32,
    pub subject_gen_id: i32,
    pub teacher_id: Option<i32>,
    pub teacher_gen_id: Option<i32>,
    pub second_teacher_id: Option<i32>,
    pub third_teacher_id: Option<i32>,
    pub fourth_teacher_id: Option<i32>,

    pub auditorium: Option<String>,
    pub created_timestamp: PrimitiveDateTime,
    pub modified_timestamp: PrimitiveDateTime,

    pub time: i32,
    pub week_day: WeekDay,
    pub week_parity: String,

    pub gen_start: i32,
    pub gen_end: Option<i32>,
    pub existence_diff: String
}

impl ScheduleObjModel {
    pub fn get_lesson_pos(&self) -> i32 {
        let mut res = self.week_day.as_num() as i32;
        if self.week_parity == "2" {
            res += 7;
        }
        res *= 14;
        res += self.time % 1000;

        res
    }
}

#[derive(sqlx::FromRow, Default, Debug, Clone)]
pub struct ScheduleGenerationModel {
    pub gen_id: i32,
    pub creation_time: chrono::NaiveDateTime,
    pub group_id: i32,
}


pub async fn get_current_schedule_for_group(con: &mut PgConnection, group_id: i32) -> DbResult<Vec<ScheduleObjModel>> {
    let res = sqlx::query_as!(ScheduleObjModel,
        "SELECT week_day as \"week_day: WeekDay\", auditorium, created_timestamp, modified_timestamp,
            existence_diff, teacher_id, second_teacher_id, third_teacher_id, fourth_teacher_id,
            teacher_gen_id, subject_id, subject_gen_id, gen_end, gen_start, schedule_obj_id,
            group_id, prev_time_link_id, time_link_id, last_known_orig_sched_obj_id,
            time, week_parity FROM schedule_objs WHERE group_id = $1 and gen_end IS NULL",
        group_id
    )
        .fetch_all(&mut *con).await?;

    Ok(res)
}

pub async fn get_current_schedule_link_ids(con: &mut PgConnection, group_id: i32) -> DbResult<Vec<i32>> {
    let res = sqlx::query_scalar!(
        "SELECT schedule_objs.time_link_id FROM schedule_objs WHERE group_id = $1 and gen_end IS NULL",
        group_id
    )
        .fetch_all(&mut *con).await?;

    //assertion to be unique
    let mut set = std::collections::HashSet::new();
    for &item in res.iter() {
        set.insert(item);
    }
    assert_eq!(set.len(), res.len());

    Ok(res)
}

pub async fn get_current_schedule_for_group_with_subject(con: &mut PgConnection, group_id: i32, subject_id: i32) -> DbResult<Vec<ScheduleObjModel>> {
    let res = sqlx::query_as!(ScheduleObjModel,
            r#"SELECT week_day as "week_day: WeekDay", auditorium, created_timestamp, modified_timestamp,
            existence_diff, teacher_id, second_teacher_id, third_teacher_id, fourth_teacher_id,
            teacher_gen_id, subject_id, subject_gen_id, gen_end, gen_start, schedule_obj_id,
            group_id, prev_time_link_id, time_link_id, last_known_orig_sched_obj_id,
            time, week_parity FROM schedule_objs WHERE group_id = $1 and gen_end IS NULL and subject_id = $2"#,
            group_id, subject_id)
        .fetch_all(&mut *con).await?;

    Ok(res)
}

pub enum TimeLinkValidResult {
    Success(bool),
    ErrorUserMessage(String)
}

pub async fn is_time_link_id_valid_for_user(con: &mut PgConnection, time_link_id: i32, user_id: i32) -> DbResult<TimeLinkValidResult> {

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(con, user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return Ok(TimeLinkValidResult::ErrorUserMessage("Failed to get user group!".to_string()));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return Ok(TimeLinkValidResult::ErrorUserMessage("User has no group!".to_string()));
    }
    let group_id = group_id.unwrap().group_id;

    is_time_link_id_valid_for_group(con, time_link_id, group_id).await
}

pub async fn is_time_link_id_valid_for_group(con: &mut PgConnection, time_link_id: i32, group_id: i32) -> DbResult<TimeLinkValidResult> {

    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_current_schedule_link_ids(con, group_id).await;

    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return Ok(TimeLinkValidResult::ErrorUserMessage("Failed to get user group schedule link ids!".to_string()));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    if !schedule_link_ids.contains(&time_link_id) {
        warn!("User group {} doesn't have time_link_id: {}", group_id, time_link_id);
        return Ok(TimeLinkValidResult::Success(false))
    }

    Ok(TimeLinkValidResult::Success(true))
}