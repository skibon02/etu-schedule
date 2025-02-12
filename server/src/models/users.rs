use anyhow::{anyhow, Context};
use rocket::time::PrimitiveDateTime;
use rocket_db_pools::Connection;
use serde_derive::{Deserialize, Serialize};
use sqlx::{Acquire, PgConnection};

use crate::models::groups::GroupModel;
use thiserror::Error;

use super::{Db, DbResult};

#[derive(Debug, sqlx::FromRow)]
pub struct UserInfo {
    pub vk_id: i32,

    pub profile_photo_url: Option<String>,
    pub first_name: String,
    pub last_name: String,
    pub birthdate: Option<String>,
    pub sex: i32,

    pub created_timestamp: PrimitiveDateTime,
    pub last_vk_fetch_timestamp: PrimitiveDateTime,
}

pub async fn create_user(mut con: Connection<Db>, user_info: UserInfo) -> DbResult<()> {
    let mut transaction = con.begin().await?;
    debug!("Creating user: {:?}", user_info);
    sqlx::query!(
        "INSERT INTO users (vk_id, created_timestamp, last_vk_fetch_timestamp, profile_photo_url, \
        first_name, last_name, sex, birthdate) VALUES ($1, NOW(), NOW(), $2, $3, $4, $5, $6)\
        ON CONFLICT DO NOTHING",
        user_info.vk_id,
        user_info.profile_photo_url,
        user_info.first_name,
        user_info.last_name,
        user_info.sex,
        user_info.birthdate
    )
    .execute(&mut *transaction)
    .await
    .map_err(|e| anyhow::anyhow!("Error creating user: {}", e))
    .map(|_| ())?;

    sqlx::query!(
        "INSERT INTO user_data(user_id) values ($1) ON CONFLICT DO NOTHING",
        user_info.vk_id
    )
    .execute(&mut *transaction)
    .await
    .map_err(|e| anyhow::anyhow!("Error creating user data: {}", e))
    .map(|_| ())?;

    transaction.commit().await?;

    Ok(())
}

pub async fn get_user_info(con: &mut PgConnection, id: i32) -> DbResult<UserInfo> {
    let res: Option<UserInfo> =
        sqlx::query_as!(UserInfo, "SELECT * FROM users WHERE vk_id = $1", id)
            .fetch_optional(&mut *con)
            .await?;

    match res {
        Some(user_info) => Ok(user_info),
        None => Err(anyhow!("User with id {} does not exist", id)),
    }
}

pub async fn user_exists(con: &mut PgConnection, id: i32) -> DbResult<bool> {
    let res = sqlx::query_scalar!("SELECT vk_id FROM users WHERE vk_id = $1", id)
        .fetch_optional(&mut *con)
        .await?;

    Ok(res.is_some())
}

pub async fn get_user_group(con: &mut PgConnection, user_id: i32) -> DbResult<Option<GroupModel>> {
    let res = sqlx::query_as!(GroupModel,
        "SELECT groups.* from groups join user_data on groups.group_id = user_data.group_id AND user_data.user_id = $1",
        user_id)
        .fetch_optional(&mut *con).await.context("Failed to get user group")?;

    Ok(res)
}

#[derive(Error, Debug)]
pub enum SetUserGroupError {
    #[error("Group {0} does not exist")]
    GroupDoesNotExist(i32),
}

/// Do not check if user exists!
pub async fn set_user_group(con: &mut PgConnection, user_id: i32, group_id: i32) -> DbResult<()> {
    let group_exists: Option<i32> =
        sqlx::query_scalar!("select group_id from groups where group_id = $1", group_id)
            .fetch_optional(&mut *con)
            .await
            .context("Failed to check if group exists")?;

    if group_exists.is_some() {
        let mut transaction = con.begin().await?;

        let different_group_id: Option<_> = sqlx::query!(
            "SELECT group_id FROM user_data \
        WHERE user_id = $1 AND group_id != $2",
            user_id,
            group_id
        )
        .fetch_optional(&mut *transaction)
        .await
        .context("Failed to check if group exists")?;

        sqlx::query!(
            "UPDATE user_data SET group_id=$1 WHERE user_id = $2",
            group_id,
            user_id
        )
        .execute(&mut *transaction)
        .await
        .context("Failed to set new user group")?;

        if different_group_id.is_some() {
            // Invalidate user attendance token
            sqlx::query!(
                "UPDATE user_data SET attendance_token=NULL WHERE user_id = $1",
                user_id
            )
            .execute(&mut *transaction)
            .await
            .context("Failed to clear previous user attendance token")?;
        }

        transaction.commit().await?;
        Ok(())
    } else {
        Err(SetUserGroupError::GroupDoesNotExist(group_id).into())
    }
}

#[derive(sqlx::Type, Debug, Deserialize, Serialize, Copy, Clone)]
#[sqlx(
    type_name = "subjects_title_formatting_type",
    rename_all = "snake_case"
)]
#[serde(rename_all = "snake_case")]
pub enum SubjectsTitleFormatting {
    Auto,
    Shorten,
}

#[derive(Default, Deserialize)]
pub struct UserDataOptionalModel {
    pub subjects_title_formatting: Option<SubjectsTitleFormatting>,
}

#[derive(sqlx::FromRow, Debug, Clone)]
pub struct UserDataModel {
    pub user_id: i32,
    pub group_id: Option<i32>,
    pub subjects_title_formatting: SubjectsTitleFormatting,
    pub last_known_schedule_generation: Option<i32>,
    pub attendance_token: Option<String>,
    pub leader_for_group: Option<i32>,
}

pub async fn set_user_data(
    con: &mut PgConnection,
    user_id: i32,
    data: UserDataOptionalModel,
) -> DbResult<()> {
    if let Some(subjects_title_formatting) = data.subjects_title_formatting {
        debug!("Setting new user data: {:?}", subjects_title_formatting);
        sqlx::query!(
            "UPDATE user_data SET subjects_title_formatting=$1 WHERE user_id = $2",
            subjects_title_formatting as SubjectsTitleFormatting,
            user_id
        )
        .execute(&mut *con)
        .await
        .context("Failed to set new user data")?;
    }
    Ok(())
}

pub async fn get_user_data(con: &mut PgConnection, user_id: i32) -> DbResult<UserDataModel> {
    let res = sqlx::query_as!(UserDataModel,
        "SELECT subjects_title_formatting as \"subjects_title_formatting: SubjectsTitleFormatting\",\
         user_id, group_id, last_known_schedule_generation, attendance_token, leader_for_group FROM user_data WHERE user_id = $1",
        user_id
    )
        .fetch_one(&mut *con).await?;

    Ok(res)
}

pub async fn reset_user_group(con: &mut PgConnection, user_id: i32) -> DbResult<()> {
    sqlx::query!(
        "UPDATE user_data SET group_id=NULL WHERE user_id = $1",
        user_id
    )
    .execute(&mut *con)
    .await
    .context("Failed to clear previous user group")?;

    Ok(())
}

pub async fn set_attendance_token(
    con: &mut PgConnection,
    user_id: i32,
    attendance_token: Option<String>,
) -> DbResult<()> {
    sqlx::query!(
        "UPDATE user_data SET attendance_token=$1 WHERE user_id = $2",
        attendance_token,
        user_id
    )
    .execute(&mut *con)
    .await
    .context("Failed to set new user attendance token")?;

    Ok(())
}

pub async fn invalidate_attendance_token(con: &mut PgConnection, user_id: i32) -> DbResult<()> {
    sqlx::query!(
        "UPDATE user_data SET attendance_token=NULL WHERE user_id = $1",
        user_id
    )
    .execute(&mut *con)
    .await
    .context("Failed to clear previous user attendance token")?;

    Ok(())
}
pub async fn confirm_privilege_level(
    con: &mut PgConnection,
    user_id: i32,
    group_id: i32,
) -> DbResult<()> {
    sqlx::query!(
        "UPDATE user_data SET leader_for_group=$1 WHERE user_id = $2",
        group_id,
        user_id
    )
    .execute(&mut *con)
    .await
    .context("Failed to clear previous user attendance token")?;

    Ok(())
}

#[derive(Serialize, Debug, Copy, Clone, PartialOrd, PartialEq)]
#[repr(i32)]
pub enum PrivilegeLevel {
    User = 0,
    Leader,
    Admin,
}

pub async fn check_privilege_level(
    con: &mut PgConnection,
    user_id: i32,
    group_id: i32,
) -> DbResult<PrivilegeLevel> {
    let res = sqlx::query_scalar!(
        "SELECT leader_for_group FROM user_data WHERE user_id = $1",
        user_id
    )
    .fetch_optional(&mut *con)
    .await
    .context("Failed to check privilege level")?;

    match res {
        Some(leader_for_group) => {
            if leader_for_group == Some(group_id) {
                Ok(PrivilegeLevel::Leader)
            } else {
                Ok(PrivilegeLevel::User)
            }
        }
        None => Ok(PrivilegeLevel::User),
    }
}

#[derive(Debug, Serialize)]
pub struct UserStats {
    pub registered_users: i32,
    pub users_with_group: i32,
    pub users_with_tokens: i32,
    pub users_with_leader_privilege: i32,
    pub most_popular_group: Option<GroupModel>,
}


pub async fn get_user_stats(con: &mut PgConnection) -> DbResult<UserStats> {
    let registered_users = sqlx::query_scalar!("SELECT COUNT(*) FROM users")
        .fetch_one(&mut *con)
        .await?;

    let users_with_group = sqlx::query_scalar!("SELECT COUNT(*) FROM user_data WHERE group_id IS NOT NULL")
        .fetch_one(&mut *con)
        .await?;

    let users_with_tokens = sqlx::query_scalar!("SELECT COUNT(*) FROM user_data WHERE attendance_token IS NOT NULL")
        .fetch_one(&mut *con)
        .await?;

    let users_with_leader_privilege = sqlx::query_scalar!("SELECT COUNT(*) FROM user_data WHERE leader_for_group IS NOT NULL")
        .fetch_one(&mut *con)
        .await?;

    let most_popular_group = sqlx::query_as!(GroupModel,
        "SELECT groups.* FROM groups JOIN user_data ON groups.group_id = user_data.group_id GROUP BY groups.group_id ORDER BY COUNT(*) DESC LIMIT 1"
    )
    .fetch_optional(&mut *con)
    .await?;

    Ok(UserStats {
        registered_users: registered_users.unwrap_or(0) as i32,
        users_with_group: users_with_group.unwrap_or(0) as i32,
        users_with_tokens: users_with_tokens.unwrap_or(0) as i32,
        users_with_leader_privilege: users_with_leader_privilege.unwrap_or(0) as i32,
        most_popular_group,
    })
}