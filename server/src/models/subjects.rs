use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::{Sqlite, Transaction};

#[derive(sqlx::FromRow, Default, Debug, Clone, PartialEq)]
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

pub async fn get_subjects_cur_gen(con: &mut PoolConnection<Sqlite>) -> anyhow::Result<u32> {
    let res: Option<u32> = sqlx::query_scalar(
        "SELECT MAX(gen_id) as max FROM subjects_generation"
    )
        .fetch_optional(&mut *con).await?;

    Ok(res.unwrap_or(0))
}

pub async fn create_new_gen(transaction: &mut Transaction<'_, Sqlite>, gen_id: u32) -> anyhow::Result<()> {
    // info!("Creating new subjects generation {}", gen_id);
    sqlx::query("INSERT OR IGNORE INTO subjects_generation (gen_id, creation_time) VALUES (?, strftime('%s', 'now'))")
        .bind(gen_id)
        .execute(transaction)
        .await.context("Failed to insert new subjects generation")?;

    Ok(())
}

pub async fn get_subjects_for_group(con: &mut PoolConnection<Sqlite>, group_id: u32) -> anyhow::Result<Vec<SubjectModel>>  {
    let res = sqlx::query_as(
        "SELECT * FROM subjects join schedule_objs on \
            subjects.subject_id = schedule_objs.subject_id and subjects.gen_start <= schedule_objs.subject_gen_id \
            and (subjects.gen_end IS null OR subjects.gen_end > schedule_objs.subject_gen_id)\
        WHERE schedule_objs.gen_end IS NULL AND schedule_objs.group_id = ? \
        GROUP BY subjects.subject_id")
        .bind(group_id)
        .fetch_all(&mut *con).await?;

    Ok(res)
}