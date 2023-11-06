use rocket_db_pools::Connection;
use sqlx::{Acquire, Sqlite};
use sqlx::pool::PoolConnection;
use crate::models::Db;

#[derive(sqlx::Type, Default, Debug, Copy, Clone)]
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
    fn as_num(&self) -> u8 {
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

#[derive(sqlx::FromRow, Default, Debug, Clone)]
pub struct ScheduleObjModel {
    pub schedule_obj_id: u32,

    pub last_known_orig_sched_obj_id: u32,

    pub group_id: u32,
    pub link_id: u32,

    pub subject_id: u32,
    pub subject_gen_id: u32,
    pub teacher_id: Option<u32>,
    pub teacher_gen_id: Option<u32>,
    pub second_teacher_id: Option<u32>,
    pub second_teacher_gen_id: Option<u32>,

    pub auditorium: Option<String>,
    pub updated_at: String,

    pub time: u32,
    pub week_day: WeekDay,
    pub week_parity: bool,

    pub gen_start: u32,
    pub gen_end: Option<u32>,
    pub existence_diff: String
}

impl ScheduleObjModel {
    pub fn get_lesson_pos(&self) -> u32 {
        let mut res = self.week_day.as_num() as u32;
        if self.week_parity {
            res += 7;
        }
        res *= 14;
        res += self.time % 1000;

        res
    }
}

#[derive(sqlx::FromRow, Default, Debug, Clone)]
pub struct SubjectModel {
    pub subject_obj_id: u32,
    pub subject_id: u32,

    // tracked with versioning
    pub title: String,
    pub short_title: Option<String>,
    pub subject_type: Option<String>,
    pub control_type: Option<String>,

    // untracked_info
    pub semester: u32,
    pub alien_id: i32,
    pub department_id: u32,

    // generation range info
    pub gen_start: u32,
    pub gen_end: Option<u32>,
    pub existence_diff: String
}

#[derive(sqlx::FromRow, Default, Debug, Clone)]
pub struct ScheduleGenerationModel {
    pub gen_id: u32,
    pub creation_time: u32,
}

pub async fn get_subject_cur_gen(con: &mut PoolConnection<Sqlite>, subject_id: u32) -> anyhow::Result<u32> {
    let res: Option<u32> = sqlx::query_scalar(
        "SELECT MAX(gen_start) as max FROM subjects WHERE subject_id = ?"
    )
        .bind(subject_id)
        .fetch_optional(&mut *con).await?;

    Ok(res.unwrap_or(0))
}

pub async fn get_current_schedule_for_group(mut con: Connection<Db>, group_id: u32) -> anyhow::Result<Vec<ScheduleObjModel>> {
    let res = sqlx::query_as(
        "SELECT * FROM schedule_objs WHERE group_id = ? and gen_end = NULL",
    )
        .bind(group_id)
        .fetch_all(con.acquire().await?).await?;

    Ok(res)
}