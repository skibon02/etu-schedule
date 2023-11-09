pub mod users;
pub mod groups;
pub mod schedule;
pub mod subjects;
pub mod teachers;

use rocket_db_pools::{sqlx, Database};
use thiserror::Error;

#[derive(Database, Clone)]
#[database("sqlx")]
pub struct Db(sqlx::SqlitePool);