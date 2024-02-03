use sqlx::pool::PoolConnection;
use sqlx::Postgres;
use std::sync::atomic::AtomicUsize;
use std::sync::OnceLock;
use std::time::Instant;
use tokio::select;

use crate::bg_workers::{process_schedule_merge, ETU_REQUEST_INTERVAL};
use crate::models;
use tokio::sync::watch::Receiver;

const SINGLE_GROUP_INTERVAL: i32 = 30;
const FORCE_REQ_CHANNEL_SIZE: usize = 50;

pub static MERGE_REQUEST_CHANNEL: OnceLock<tokio::sync::mpsc::Sender<i32>> = OnceLock::new();
pub static MERGE_REQUEST_CNT: AtomicUsize = AtomicUsize::new(0);

pub async fn priority_schedule_merge_task(
    mut con: &mut PoolConnection<Postgres>,
    mut shutdown_watcher: Receiver<bool>,
) {
    // For demonstration, use a loop with a delay
    let (tx, mut rx) = tokio::sync::mpsc::channel(FORCE_REQ_CHANNEL_SIZE);
    MERGE_REQUEST_CHANNEL.set(tx).unwrap();

    // for balancing forced requests
    let mut last_etu_request =
        Instant::now() - tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL);
    let mut fail_counter = 0;
    loop {
        select!(
            Some(request) = rx.recv() => {
                MERGE_REQUEST_CNT.fetch_sub(1, std::sync::atomic::Ordering::Relaxed);
                info!("PRIORITY_MERGE_TASK: Got request for merging {} group", request);

                let time = models::groups::get_time_since_last_group_merge(request, &mut *con).await;
                match time {
                    Ok(time) => {
                        match time {
                            Some(time) => {
                                if time < SINGLE_GROUP_INTERVAL {
                                    info!("PRIORITY_MERGE_TASK: Last merge for group {} was {} seconds ago, skipping...", request, time);
                                    continue;
                                }
                            },
                            None => {
                                info!("PRIORITY_MERGE_TASK: Group schedule was never requested! Launching merge...");
                            }
                        }
                    },
                    Err(_) => {
                        warn!("PRIORITY_MERGE_TASK: Non-existing group merge requested: {}!", request);
                        continue;
                    }
                }

                if Instant::now() - last_etu_request < tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) {
                    info!("PRIORITY_MERGE_TASK: Last ETU request was {} seconds ago, waiting...", (Instant::now() - last_etu_request).as_secs());
                    select!(
                        _ = tokio::time::sleep(tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) - (Instant::now() - last_etu_request)) => {}
                        _ = shutdown_watcher.changed() => {
                            warn!("PRIORITY_MERGE_TASK: Shutdown notification recieved! exiting task...");
                            return
                        }
                    );
                }
                last_etu_request = Instant::now();

                if let Err(e) = process_schedule_merge(vec![request], &mut con).await {
                    warn!("PRIORITY_MERGE_TASK: Error while merging group {}: {:?}", request, e);
                    fail_counter += 1;
                    if fail_counter > 5 {
                        error!("PRIORITY_MERGE_TASK: Too many fails, interrupting task...");
                        return;
                    }
                }
            }
            _ = shutdown_watcher.changed() => {
                warn!("PRIORITY_MERGE_TASK: Shutdown notification recieved! exiting task...");
                return
            }
        );
    }
}
