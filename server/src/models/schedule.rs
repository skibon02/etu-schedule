use rocket::time::PrimitiveDateTime;

use sqlx::PgConnection;

use crate::models;
use crate::models::subjects::SubjectModel;
use crate::models::DbResult;

#[derive(sqlx::Type, Default, Debug, Copy, Clone, Ord, PartialOrd, Eq, PartialEq)]
#[sqlx(type_name = "week_day", rename_all = "UPPERCASE")]
pub enum WeekDay {
    #[default]
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
    Sun,
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
            WeekDay::Sun => 6,
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
            _ => Err(()),
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
            _ => Err(()),
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
    pub teacher_gen_id: Option<i32>,

    pub auditorium: Option<String>,
    pub created_timestamp: PrimitiveDateTime,
    pub modified_timestamp: PrimitiveDateTime,

    /// Time is lesson number, 0 - 8:00, 7 - max
    pub time: i32,
    pub week_day: WeekDay,
    pub week_parity: String,

    pub gen_start: i32,
    pub gen_end: Option<i32>,
    pub existence_diff: String,
}

#[derive(Debug, Clone)]
pub struct ScheduleObjModelNormalized {
    pub schedule_object: ScheduleObjModel,
    pub teachers: Vec<i32>,
}

impl ScheduleObjModel {
    pub fn get_lesson_pos(&self) -> i32 {
        let mut res = self.week_day.as_num() as i32;
        if self.week_parity == "2" {
            res += 7;
        }
        res *= 8; // 8 lessons per day
        res += self.time;

        res
    }
}

#[derive(sqlx::FromRow, Default, Debug, Clone)]
pub struct ScheduleGenerationModel {
    pub gen_id: i32,
    pub creation_time: chrono::NaiveDateTime,
    pub group_id: i32,
}

pub async fn get_cur_subjects_for_group(
    con: &mut PgConnection,
    group_id: i32,
) -> DbResult<Vec<SubjectModel>> {
    let res = sqlx::query_as!(
        SubjectModel,
        "SELECT DISTINCT subjects.* FROM subjects join schedule_objs on \
            subjects.subject_id = schedule_objs.subject_id and subjects.gen_start <= schedule_objs.subject_gen_id \
            and (subjects.gen_end IS NULL or subjects.gen_end > schedule_objs.subject_gen_id) \
            WHERE schedule_objs.group_id = $1 and schedule_objs.gen_end is NULL",
        group_id
    )
    .fetch_all(&mut *con)
    .await?;

    Ok(res.into_iter().collect())
}

pub async fn get_cur_schedule_for_group(
    con: &mut PgConnection,
    group_id: i32,
) -> DbResult<Vec<ScheduleObjModelNormalized>> {
    let res = sqlx::query_as!(ScheduleObjModel,
        "SELECT week_day as \"week_day: WeekDay\", auditorium, created_timestamp, modified_timestamp,
            existence_diff,
            teacher_gen_id, subject_id, subject_gen_id, gen_end, gen_start, schedule_obj_id,
            group_id, prev_time_link_id, time_link_id, last_known_orig_sched_obj_id,
            time, week_parity FROM schedule_objs WHERE group_id = $1 and gen_end IS NULL",
        group_id
    )
        .fetch_all(&mut *con).await?;

    let teachers = sqlx::query!(
        r#"SELECT schedule_objs_teachers.* from schedule_objs_teachers JOIN schedule_objs
        ON schedule_objs.schedule_obj_id = schedule_objs_teachers.schedule_obj_id
        WHERE schedule_objs.group_id = $1 and schedule_objs.gen_end IS NULL"#,
        group_id
    )
    .fetch_all(&mut *con)
    .await?;

    let res = res
        .into_iter()
        .map(|x| {
            let teachers = teachers
                .iter()
                .filter(|t| t.schedule_obj_id == x.schedule_obj_id)
                .map(|t| t.teacher_id)
                .collect();
            ScheduleObjModelNormalized {
                schedule_object: x,
                teachers,
            }
        })
        .collect();

    Ok(res)
}

pub async fn get_cur_schedule_link_ids(
    con: &mut PgConnection,
    group_id: i32,
) -> DbResult<Vec<i32>> {
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

pub async fn get_cur_schedule_for_group_with_subject(
    con: &mut PgConnection,
    group_id: i32,
    subject_id: i32,
) -> DbResult<Vec<ScheduleObjModelNormalized>> {
    let res = sqlx::query_as!(ScheduleObjModel,
            r#"SELECT week_day as "week_day: WeekDay", auditorium, created_timestamp, modified_timestamp,
            existence_diff, teacher_gen_id, subject_id, subject_gen_id,
             gen_end, gen_start, schedule_obj_id, group_id, prev_time_link_id, 
             time_link_id, last_known_orig_sched_obj_id, time, week_parity 
             FROM schedule_objs WHERE group_id = $1 and gen_end IS NULL and subject_id = $2"#,
            group_id, subject_id)
        .fetch_all(&mut *con).await?;

    let teachers = sqlx::query!(
        r#"SELECT schedule_objs_teachers.* from schedule_objs_teachers JOIN schedule_objs
        ON schedule_objs.schedule_obj_id = schedule_objs_teachers.schedule_obj_id
        WHERE schedule_objs.group_id = $1 and schedule_objs.gen_end IS NULL
        AND subject_id = $2"#,
        group_id,
        subject_id
    )
    .fetch_all(&mut *con)
    .await?;

    let res = res
        .into_iter()
        .map(|x| {
            let teachers = teachers
                .iter()
                .filter(|t| t.schedule_obj_id == x.schedule_obj_id)
                .map(|t| t.teacher_id)
                .collect();
            ScheduleObjModelNormalized {
                schedule_object: x,
                teachers,
            }
        })
        .collect();
    Ok(res)
}

pub enum TimeLinkValidResult {
    Success(bool),
    ErrorUserMessage(String),
}

pub async fn is_time_link_id_valid_for_user(
    con: &mut PgConnection,
    time_link_id: i32,
    user_id: i32,
) -> DbResult<TimeLinkValidResult> {
    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(con, user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return Ok(TimeLinkValidResult::ErrorUserMessage(
            "Failed to get user group!".to_string(),
        ));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return Ok(TimeLinkValidResult::ErrorUserMessage(
            "User has no group!".to_string(),
        ));
    }
    let group_id = group_id.unwrap().group_id;

    is_time_link_id_valid_for_group(con, time_link_id, group_id).await
}

pub async fn is_time_link_id_valid_for_group(
    con: &mut PgConnection,
    time_link_id: i32,
    group_id: i32,
) -> DbResult<TimeLinkValidResult> {
    // get user group link_id elements
    let schedule_link_ids = models::schedule::get_cur_schedule_link_ids(con, group_id).await;

    if let Err(e) = schedule_link_ids {
        error!("Failed to get user group schedule link ids: {:?}", e);
        return Ok(TimeLinkValidResult::ErrorUserMessage(
            "Failed to get user group schedule link ids!".to_string(),
        ));
    }
    let schedule_link_ids = schedule_link_ids.unwrap();

    if !schedule_link_ids.contains(&time_link_id) {
        warn!(
            "User group {} doesn't have time_link_id: {}",
            group_id, time_link_id
        );
        return Ok(TimeLinkValidResult::Success(false));
    }

    Ok(TimeLinkValidResult::Success(true))
}
