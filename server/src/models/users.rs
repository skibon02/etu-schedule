use anyhow::{anyhow, Context};
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use sqlx::{Acquire, Row, Sqlite};
use sqlx::pool::PoolConnection;
use thiserror::Error;
use crate::models::groups::GroupModel;

use super::Db;

#[derive(Debug)]
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
    let mut transaction = con.begin().await?;
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
        .execute(&mut *transaction)
        .await
        .map_err(|e| anyhow::anyhow!("Error creating user: {}", e))
        .map(|_| ())?;

    sqlx::query("INSERT OR IGNORE INTO user_data(user_id) values (?)")
        .bind(user_info.vk_id)
        .execute(&mut *transaction)
        .await
        .map_err(|e| anyhow::anyhow!("Error creating user data: {}", e))
        .map(|_| ())?;

    transaction.commit().await?;

    Ok(())
}

pub async fn get_user_info(con: &mut PoolConnection<Sqlite>, id: u32) -> anyhow::Result<UserInfo> {
    let res = sqlx::query_as::<_, UserInfo>(
        "SELECT * FROM users WHERE vk_id = ?",
    )
        .bind(id)
        .fetch_optional(&mut *con).await?.ok_or(anyhow::anyhow!("User not found"))?;


    Ok(res)
}

pub async fn user_exists(con: &mut PoolConnection<Sqlite>, id: u32) -> anyhow::Result<bool> {
    let res = sqlx::query(
        "SELECT vk_id FROM users WHERE vk_id = ?",
    )
        .bind(id)
        .fetch_one(&mut *con).await?;

    Ok(res.get::<u32, _>("vk_id") == id)
}

pub async fn get_user_group(con: &mut PoolConnection<Sqlite>, user_id: u32) -> anyhow::Result<Option<GroupModel>> {
    let res = sqlx::query_as("SELECT * from groups join user_data on groups.group_id = user_data.group_id AND user_data.user_id = ?")
        .bind(user_id)
        .fetch_optional(&mut *con).await.context("Failed to get user group")?;

    Ok(res)
}


#[derive(Error, Debug)]
pub enum SetUserGroupError {
    #[error("Group {0} does not exist")]
    GroupDoesNotExist(u32),
}

/// Do not check if user exists!
pub async fn set_user_group(con: &mut PoolConnection<Sqlite>, user_id: u32, group_id: u32) -> anyhow::Result<()> {
    let group_exists: Option<u32> = sqlx::query_scalar("select group_id from groups where group_id = ?")
        .bind(group_id)
        .fetch_optional(&mut *con).await.context("Failed to check if group exists")?;


    if group_exists.is_some() {
        let mut transaction = con.begin().await?;

        let different_group_id: Option<u32> = sqlx::query_scalar("SELECT group_id FROM user_data WHERE user_id = ? AND group_id != ?")
            .bind(user_id)
            .bind(group_id)
            .fetch_optional(&mut *transaction).await.context("Failed to check if group exists")?;

        sqlx::query("UPDATE user_data SET group_id=? WHERE user_id = ?")
            .bind(group_id)
            .bind(user_id)
            .execute(&mut *transaction).await.context("Failed to set new user group")?;

        if different_group_id.is_some() {
            // Invalidate user attendance token
            sqlx::query("UPDATE user_data SET attendance_token=NULL WHERE user_id = ?")
                .bind(user_id)
                .execute(&mut *transaction).await.context("Failed to clear previous user attendance token")?;
        }

        transaction.commit().await?;
        Ok(())
    }
    else {
        Err(SetUserGroupError::GroupDoesNotExist(group_id).into())
    }
}

#[derive(sqlx::Type, Debug, Deserialize, Serialize, Copy, Clone)]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum SubjectsTitleFormatting {
    Auto,
    Shorten
}

#[derive(Default, Deserialize)]
pub struct UserDataOptionalModel {
    pub subjects_title_formatting: Option<SubjectsTitleFormatting>,
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserDataModel {
    pub user_id: u32,
    pub group_id: Option<u32>,
    pub subjects_title_formatting: SubjectsTitleFormatting,
    pub last_known_schedule_generation: Option<u32>,
    pub attendance_token: Option<String>
}


pub async fn set_user_data(con: &mut PoolConnection<Sqlite>, user_id: u32,  data: UserDataOptionalModel) -> anyhow::Result<()> {
    if let Some(subjects_title_formatting) = data.subjects_title_formatting {
        debug!("Setting new user data: {:?}", subjects_title_formatting);
        sqlx::query("UPDATE user_data SET subjects_title_formatting=? WHERE user_id = ?")
            .bind(subjects_title_formatting)
            .bind(user_id)
            .execute(&mut *con).await.context("Failed to set new user data")?;
    }
    Ok(())
}

pub async fn get_user_data(con: &mut PoolConnection<Sqlite>, user_id: u32) -> anyhow::Result<UserDataModel> {
    let res = sqlx::query_as::<_, UserDataModel>(
        "SELECT * FROM user_data WHERE user_id = ?",
    )
        .bind(user_id)
        .fetch_one(&mut *con).await?;

    Ok(res)
}

pub async fn reset_user_group(con: &mut PoolConnection<Sqlite>, user_id: u32) -> anyhow::Result<()> {
    sqlx::query("UPDATE user_data SET group_id=NULL WHERE user_id = ?")
        .bind(user_id)
        .execute(&mut *con).await.context("Failed to clear previous user group")?;

    Ok(())
}

pub async fn set_attendance_token(con: &mut PoolConnection<Sqlite>, user_id: u32, attendance_token: Option<String>) -> anyhow::Result<()> {
    sqlx::query("UPDATE user_data SET attendance_token=? WHERE user_id = ?")
        .bind(attendance_token)
        .bind(user_id)
        .execute(&mut *con).await.context("Failed to set new user attendance token")?;

    Ok(())
}
