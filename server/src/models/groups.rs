use sqlx::{Acquire, Row, Postgres, PgConnection};

use super::{Db, DbResult};
use serde_derive::Serialize;
use sqlx::pool::PoolConnection;
use sqlx::postgres::types::PgInterval;
use time::PrimitiveDateTime;

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct FacultyModel {
    pub faculty_id: i32,
    pub title: String,
}
#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct DepartmentModel {
    pub department_id: i32,
    pub title: String,
    #[serde(rename = "type")]
    pub department_type: String,

    pub long_title: Option<String>,
    pub faculty_id: Option<i32>,
}

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct GroupModel {
    pub group_id: i32,
    pub number: String,
    pub studying_type: String,
    pub education_level: String,
    pub start_year: i32,
    pub end_year: i32,
    pub department_id: i32,
    pub specialty_id: i32,
    pub latest_schedule_merge_timestamp: Option<PrimitiveDateTime>,
}

pub async fn get_oldest_group_id_list(con: &mut PgConnection, upper_limit: i64) -> DbResult<Vec<i32>> {
    let res = sqlx::query_scalar!(
        "SELECT group_id FROM groups
         ORDER BY
             CASE
                 WHEN latest_schedule_merge_timestamp IS NULL THEN 0
                 ELSE 1
             END,
             latest_schedule_merge_timestamp ASC
         LIMIT $1",
        upper_limit
    )
        .fetch_all(&mut *con).await?;

    if res.len() == 0 {
        return Err(anyhow::anyhow!("No groups found!"));
    }
    Ok(res)
}


pub async fn get_not_merged_sched_group_id_list(con: &mut PgConnection, upper_limit: i64) -> DbResult<Vec<i32>> {
    let res = sqlx::query_scalar!(
        "SELECT group_id FROM groups
            WHERE latest_schedule_merge_timestamp IS NULL
            ORDER BY
             latest_schedule_merge_timestamp ASC
         LIMIT $1",
        upper_limit
    )
        .fetch_all(&mut *con).await?;

    if res.len() == 0 {
        return Err(anyhow::anyhow!("No groups found!"));
    }
    Ok(res)
}

// Result: is group exists?
// Option: if merge was ever made for this group?
pub async fn get_time_since_last_group_merge(group_id: i32, con: &mut PgConnection) -> DbResult<Option<i32>> {
    // 1 option: if we have such group and it has latest_schedule_merge_timestamp
    //
    let res: Option<Option<PgInterval>> = sqlx::query_scalar!(
        "SELECT NOW() - latest_schedule_merge_timestamp FROM groups WHERE group_id = $1 \
        and latest_schedule_merge_timestamp IS NOT NULL",
        group_id)
        .fetch_optional(&mut *con).await?;

    //silly one
    let res = match res {
        Some(Some(res)) => Some(res),
        _ => None
    };

    match res {
        Some(res) => Ok(Some((res.microseconds/1000000) as i32)),
        None => {
            //check if it is null
            let res: Option<i32> = sqlx::query_scalar!(
                "SELECT group_id FROM groups WHERE group_id = $1 and latest_schedule_merge_timestamp IS NULL", group_id)
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

pub async fn set_last_group_merge(group_id: i32, con: &mut PgConnection) -> DbResult<()> {
    sqlx::query!(
        "UPDATE groups SET latest_schedule_merge_timestamp = NOW() WHERE group_id = $1", group_id)
        .execute(&mut *con).await?;

    Ok(())
}
pub async fn get_groups(con: &mut PgConnection) -> DbResult<Vec<GroupModel>> {
    let res = sqlx::query_as!(GroupModel,
        "SELECT * FROM groups"
    )
        .fetch_all(&mut *con).await?;

    Ok(res)
}

pub async fn get_group(con: &mut PgConnection, group_id: i32) -> DbResult<Option<GroupModel>> {
    let res = sqlx::query_as!(
        GroupModel,
        "SELECT * FROM groups WHERE group_id = $1",
        group_id
    )
        .fetch_optional(&mut *con).await?;

    Ok(res)
}

pub async fn find_group_by_name(con: &mut PgConnection, group_name: &str) -> DbResult<Option<GroupModel>> {
    let res = sqlx::query_as!(
        GroupModel,
        "SELECT * FROM groups WHERE number = $1",
        group_name
    )
        .fetch_optional(&mut *con).await?;

    Ok(res)
}