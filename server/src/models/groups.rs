use rocket_db_pools::Connection;
use sqlx::{Acquire, Row};

use super::Db;
use serde_derive::Serialize;

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct FacultyModel {
    pub faculty_id: u32,
    pub title: String,
}
#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct DepartmentModel {
    pub department_id: u32,
    pub title: String,
    pub long_title: String,
    #[serde(rename = "type")]
    pub department_type: String,
    pub faculty_id: u32,
}

#[derive(Serialize, Debug, sqlx::FromRow, PartialEq, Clone)]
pub struct GroupsModel {
    pub group_id: u32,
    pub number: String,
    pub studying_type: String,
    pub education_level: String,
    pub start_year: u16,
    pub end_year: u16,
    pub department_id: u32,
    pub specialty_id: u32,
}

pub async fn get_groups(mut con: Connection<Db>) -> anyhow::Result<Vec<GroupsModel>> {
    let res = sqlx::query_as(
        "SELECT * FROM groups",
    )
        .fetch_all(con.acquire().await?).await?;

    Ok(res)
}

pub async fn get_group(mut con: Connection<Db>, group_id: u32) -> anyhow::Result<GroupsModel> {
    let res = sqlx::query_as(
        "SELECT * FROM groups WHERE group_id = ?",
    )
        .bind(group_id)
        .fetch_one(con.acquire().await?).await?;

    Ok(res)
}

