pub mod attendance;
pub mod groups;
pub mod notes;
pub mod schedule;
pub mod subjects;
pub mod teachers;
pub mod users;

use rocket_db_pools::{sqlx, Database};

#[derive(Database, Clone)]
#[database("postgres")]
pub struct Db(sqlx::PgPool);

/// Result type for database operations, error leads to a 500 response
pub type DbResult<T> = anyhow::Result<T>;
