use std::sync::Arc;
use tokio::sync::Notify;
use crate::models::Db;

pub async fn attendance_keep_alive_task(con: Db, shutdown_notifier: Arc<Notify>) {

}