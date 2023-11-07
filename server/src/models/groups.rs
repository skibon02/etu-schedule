use rocket_db_pools::Connection;
use sqlx::{Acquire, Row, Sqlite};

use super::Db;
use serde_derive::Serialize;
use sqlx::pool::PoolConnection;

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct FacultyModel {
    pub faculty_id: u32,
    pub title: String,
}
#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct DepartmentModel {
    pub department_id: u32,
    pub title: String,
    #[serde(rename = "type")]
    pub department_type: String,

    pub long_title: Option<String>,
    pub faculty_id: Option<u32>,
}

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct GroupModel {
    pub group_id: u32,
    pub number: String,
    pub studying_type: String,
    pub education_level: String,
    pub start_year: u16,
    pub end_year: u16,
    pub department_id: u32,
    pub specialty_id: u32,
}

pub async fn get_oldest_group_id_list(con: &mut Db, upper_limit: u32) -> anyhow::Result<Vec<u32>> {
    let res = sqlx::query_scalar(
        "SELECT * FROM groups
         ORDER BY
             CASE
                 WHEN latest_schedule_merge IS NULL THEN 0
                 ELSE 1
             END,
             latest_schedule_merge ASC
         LIMIT ?",
    )
        .bind(upper_limit)
        .fetch_all(&mut con.acquire().await.unwrap()).await?;

    if res.len() == 0 {
        return Err(anyhow::anyhow!("No groups found!"));
    }
    Ok(res)
}


pub async fn get_not_merged_sched_group_id_list(con: &mut Db, upper_limit: u32) -> anyhow::Result<Vec<u32>> {
    let res = sqlx::query_scalar(
        "SELECT * FROM groups
            WHERE latest_schedule_merge IS NULL
            ORDER BY
             latest_schedule_merge ASC
         LIMIT ?",
    )
        .bind(upper_limit)
        .fetch_all(&mut con.acquire().await.unwrap()).await?;

    if res.len() == 0 {
        return Err(anyhow::anyhow!("No groups found!"));
    }
    Ok(res)
}

// Result: is group exists?
// Option: if merge was ever made for this group?
pub async fn get_time_since_last_group_merge(group_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<Option<u32>> {
    let res: Option<u32> = sqlx::query_scalar(
        "SELECT strftime('%s', 'now') - latest_schedule_merge FROM groups WHERE group_id = ? and latest_schedule_merge IS NOT NULL")
        .bind(group_id)
        .fetch_optional(&mut *con).await?;

    match res {
        Some(res) => Ok(Some(res)),
        None => {
            //check if it is null
            let res: Option<u32> = sqlx::query_scalar(
                "SELECT group_id FROM groups WHERE group_id = ? and latest_schedule_merge IS NULL")
                .bind(group_id)
                .fetch_optional(&mut *con).await?;

            match res {
                Some(_) => {
                    Ok(None)
                },
                None => {
                    Err(anyhow::anyhow!("Error: cannot find group!"))
                }
            }
        }
    }
}

pub async fn set_last_group_merge(group_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    sqlx::query(
        "UPDATE groups SET latest_schedule_merge = strftime('%s', 'now') WHERE group_id = ?")
        .bind(group_id)
        .execute(&mut *con).await?;

    Ok(())
}
pub async fn get_groups(mut con: Connection<Db>) -> anyhow::Result<Vec<GroupModel>> {
    let res = sqlx::query_as(
        "SELECT * FROM groups",
    )
        .fetch_all(&mut *con).await?;

    Ok(res)
}

pub async fn get_group(mut con: Connection<Db>, group_id: u32) -> anyhow::Result<GroupModel> {
    let res = sqlx::query_as(
        "SELECT * FROM groups WHERE group_id = ?",
    )
        .bind(group_id)
        .fetch_one(&mut *con).await?;

    Ok(res)
}