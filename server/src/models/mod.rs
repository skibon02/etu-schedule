pub mod users;
pub mod groups;
pub mod schedule;

use rocket_db_pools::{sqlx, Database};

#[derive(Database, Clone)]
#[database("sqlx")]
pub struct Db(sqlx::SqlitePool);
