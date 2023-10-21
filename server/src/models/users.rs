use rocket_db_pools::Connection;
use sqlx::Acquire;

use super::Db;

pub async fn create_user(mut con: Connection<Db>, id: &String) -> anyhow::Result<()> {
    let res = sqlx::query("INSERT OR IGNORE INTO users (vk_id, creation_date_time) VALUES (?, strftime('%s', 'now'))")
        .bind(id.parse::<u32>().unwrap())
        .execute(con.acquire().await?)
        .await.unwrap();
    Ok(())
}
