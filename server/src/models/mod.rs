pub mod users;
pub mod groups;
pub mod schedule;
pub mod subjects;
pub mod teachers;
pub mod attendance;
pub mod notes;

use rocket_db_pools::{sqlx, Database};

#[derive(Database, Clone)]
#[database("postgres")]
pub struct Db(sqlx::PgPool);