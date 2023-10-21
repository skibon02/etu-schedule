use rocket_db_pools::Connection;
use serde_derive::Serialize;
use sqlx::{Acquire, Row};

use super::Db;

#[derive(Serialize)]
#[derive(Default, Debug)]
pub struct AuthorizeInfo {
    pub access_token: Option<String>,
    pub user_id: String,
}

#[derive(Serialize)]
#[derive(Default, Debug)]
pub struct UserInfo {
    pub auth: AuthorizeInfo,

    pub profile_photo_url: String,
    pub first_name: String,
    pub last_name: String,
    pub birthdate: String,
    pub sex: u8,

    pub created_datetime: Option<u32>,
    pub last_vk_fetch_datetime: Option<u32>,
}

pub async fn create_user(mut con: Connection<Db>, user_info: UserInfo) -> anyhow::Result<()> {
    debug!("Creating user: {:?}", user_info);
    sqlx::query(
        "INSERT OR IGNORE INTO users (vk_id, creation_date_time, last_vk_fetch_date_time, profile_photo_url, first_name, last_name, sex, birthdate) VALUES (?, strftime('%s', 'now'), strftime('%s', 'now'), ?, ?, ?, ?, ?)",
    )
        .bind(user_info.auth.user_id.parse::<u32>().unwrap())
        .bind(user_info.profile_photo_url)
        .bind(user_info.first_name)
        .bind(user_info.last_name)
        .bind(user_info.sex)
        .bind(user_info.birthdate)
        .execute(con.acquire().await?)
        .await
        .map_err(|e| anyhow::anyhow!("Error creating user: {}", e))
        .map(|_| ())
}

pub async fn get_user_info(mut con: Connection<Db>, id: &str) -> anyhow::Result<UserInfo> {
    let res = sqlx::query(
        "SELECT vk_id, first_name, last_name, sex, birthdate, profile_photo_url, creation_date_time, last_vk_fetch_date_time FROM users WHERE vk_id = ?",
    )
        .bind(id.parse::<u32>().unwrap())
        .fetch_one(con.acquire().await?).await?;

    Ok(UserInfo {
        first_name: res.get("first_name"),
        last_name: res.get("last_name"),
        auth: AuthorizeInfo {
            access_token: None,
            user_id: id.to_string(),
        },
        profile_photo_url: res.get("profile_photo_url"),
        sex: res.get("sex"),
        birthdate: res.get("birthdate"),
        created_datetime: res.get("creation_date_time"),
        last_vk_fetch_datetime: res.get("last_vk_fetch_date_time"),
    })
}

pub async fn user_exists(mut con: Connection<Db>, id: &str) -> anyhow::Result<bool> {
    let res = sqlx::query(
        "SELECT vk_id FROM users WHERE vk_id = ?",
    )
        .bind(id.parse::<u32>().unwrap())
        .fetch_one(con.acquire().await?).await?;

    Ok(res.get::<u32, _>("vk_id") == id.parse::<u32>().unwrap())
}
