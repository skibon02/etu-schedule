use anyhow::{anyhow, Context};
use rocket_db_pools::Connection;
use serde_derive::Serialize;
use sqlx::{Acquire, Row};
use thiserror::Error;
use crate::models::groups::GroupModel;

use super::Db;

#[derive(Serialize)]
#[derive(Default, Debug)]
#[derive(sqlx::FromRow)]
pub struct UserInfo {
    pub vk_id: u32,

    pub profile_photo_url: String,
    pub first_name: String,
    pub last_name: String,
    pub birthdate: String,
    pub sex: u8,

    pub creation_date_time: Option<u32>,
    pub last_vk_fetch_date_time: Option<u32>,
}

pub async fn create_user(mut con: Connection<Db>, user_info: UserInfo) -> anyhow::Result<()> {
    debug!("Creating user: {:?}", user_info);
    sqlx::query(
        "INSERT OR IGNORE INTO users (vk_id, creation_date_time, last_vk_fetch_date_time, profile_photo_url, first_name, last_name, sex, birthdate) VALUES (?, strftime('%s', 'now'), strftime('%s', 'now'), ?, ?, ?, ?, ?)",
    )
        .bind(user_info.vk_id)
        .bind(user_info.profile_photo_url)
        .bind(user_info.first_name)
        .bind(user_info.last_name)
        .bind(user_info.sex)
        .bind(user_info.birthdate)
        .execute(&mut **con)
        .await
        .map_err(|e| anyhow::anyhow!("Error creating user: {}", e))
        .map(|_| ())
}

pub async fn get_user_info(mut con: Connection<Db>, id: u32) -> anyhow::Result<UserInfo> {
    let res = sqlx::query_as::<_, UserInfo>(
        "SELECT * FROM users WHERE vk_id = ?",
    )
        .bind(id)
        .fetch_optional(&mut **con).await?.ok_or(anyhow::anyhow!("User not found"))?;


    Ok(res)
}

pub async fn user_exists(mut con: Connection<Db>, id: u32) -> anyhow::Result<bool> {
    let res = sqlx::query(
        "SELECT vk_id FROM users WHERE vk_id = ?",
    )
        .bind(id)
        .fetch_one(&mut **con).await?;

    Ok(res.get::<u32, _>("vk_id") == id)
}

pub async fn get_user_group(mut con: Connection<Db>, user_id: u32) -> anyhow::Result<Option<GroupModel>> {
    let res = sqlx::query_as("SELECT * from groups join user_group on groups.group_id = user_group.group_id AND user_group.user_id = ?")
        .bind(user_id)
        .fetch_optional(&mut *con).await.context("Failed to get user group")?;

    Ok(res)
}


#[derive(Error, Debug)]
pub enum SetUserGroupError {
    #[error("Group {0} does not exist")]
    GroupDoesNotExist(u32),
}
pub async fn set_user_group(mut con: Connection<Db>, user_id: u32, group_id: u32) -> anyhow::Result<()> {
    let group_exists: Option<u32> = sqlx::query_scalar("select group_id from groups where group_id = ?")
        .bind(group_id)
        .fetch_optional(&mut *con).await.context("Failed to check if group exists")?;

    if group_exists.is_some() {
        sqlx::query("DELETE FROM user_group WHERE user_id = ?")
            .bind(user_id)
            .execute(&mut *con).await.context("Failed to clear previous user group")?;
        sqlx::query("INSERT INTO user_group(user_id, group_id) values (?, ?)")
            .bind(user_id)
            .bind(group_id)
            .execute(&mut *con).await.context("Failed to get user group")?;

        Ok(())
    }
    else {
        Err(SetUserGroupError::GroupDoesNotExist(group_id).into())
    }
}

pub async fn reset_user_group(mut con: Connection<Db>, user_id: u32) -> anyhow::Result<()> {
    sqlx::query("DELETE FROM user_group WHERE user_id = ?")
        .bind(user_id)
        .execute(&mut *con).await.context("Failed to clear previous user group")?;

    Ok(())
}
