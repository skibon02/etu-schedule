pub mod users;
pub mod groups;
pub mod schedule;
pub mod subjects;

use rocket_db_pools::{sqlx, Database};

#[derive(Database, Clone)]
#[database("sqlx")]
pub struct Db(sqlx::SqlitePool);
