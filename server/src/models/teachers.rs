use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::{Row, Sqlite, Transaction};
use sqlx::sqlite::SqliteRow;

#[derive(sqlx::FromRow, Default, Debug, Clone, PartialEq)]
pub struct TeacherModel {
    pub teacher_obj_id: u32,
    pub teacher_id: u32,

    // tracked with versioning
    pub initials: String,
    pub name: String,
    pub surname: String,
    pub midname: String,
    pub birthday: String,
    pub email: Option<String>,
    pub group_id: Option<u32>,
    pub is_worker: bool,
    pub is_department_head: bool,
    pub is_department_dispatcher: bool,
    pub is_student: bool,
    pub position: Option<String>,
    pub degree: Option<String>,
    pub rank: Option<String>,

    // untracked_info

    // generation range info
    pub gen_start: u32,
    pub gen_end: Option<u32>,
    pub existence_diff: String
}

pub async fn get_teachers_cur_gen(con: &mut PoolConnection<Sqlite>) -> anyhow::Result<u32> {
    let res: Option<u32> = sqlx::query_scalar(
        "SELECT MAX(gen_id) as max FROM teachers_generation"
    )
        .fetch_optional(&mut *con).await.context("Failed to get current teachers generation")?;

    Ok(res.unwrap_or(0))
}

pub async fn create_new_gen(transaction: &mut Transaction<'_, Sqlite>, gen_id: u32) -> anyhow::Result<()> {
    // info!("Creating new teachers generation {}", gen_id);
    sqlx::query("INSERT OR IGNORE INTO teachers_generation (gen_id, creation_time) VALUES (?, strftime('%s', 'now'))")
        .bind(gen_id)
        .execute(transaction)
        .await.context("Failed to insert new teachers generation")?;

    Ok(())
}

pub async fn get_teachers_for_group(con: &mut PoolConnection<Sqlite>, group_id: u32) -> anyhow::Result<Vec<TeacherModel>>  {
    let res = sqlx::query_as(
        "select * from teachers where teachers.teacher_id in (SELECT DISTINCT teachers.teacher_id FROM teachers join schedule_objs on \
            (teachers.teacher_id = schedule_objs.teacher_id OR \
                teachers.teacher_id = schedule_objs.second_teacher_id OR \
                teachers.teacher_id = schedule_objs.third_teacher_id OR \
                teachers.teacher_id = schedule_objs.fourth_teacher_id) \
            and teachers.gen_start <= schedule_objs.teacher_gen_id \
            AND (teachers.gen_end IS null OR teachers.gen_end > schedule_objs.teacher_gen_id) \
        WHERE schedule_objs.gen_end IS NULL and schedule_objs.group_id = ?)")
        .bind(group_id)
        .fetch_all(&mut *con).await.context("Failed to get group current first teachers")?;


    Ok(res)
}

pub async fn get_teacher_departments(teacher_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<Vec<String>> {
    let res = sqlx::query("select department from teachers_departments WHERE teacher_id = ?")
        .bind(teacher_id)
        .fetch_all(&mut *con).await.context("Failed to get teacher departments")?;

    let res = res.into_iter().map(|r :SqliteRow| r.get(0)).collect::<Vec<String>>();

    Ok(res)
}