pub mod users;
pub mod groups;

use rocket_db_pools::{sqlx, Database};

#[derive(Database, Clone)]
#[database("sqlx")]
pub struct Db(sqlx::SqlitePool);

#[derive(Debug)]
pub enum MergeResult {
    NotModified,
    Updated,
    Inserted
}

#[derive(Debug)]
pub enum MergeError{
    InsertionFailure,
    UpdateFailure
}