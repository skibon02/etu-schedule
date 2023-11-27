use std::sync::atomic::AtomicUsize;
use std::sync::{Arc, OnceLock};
use std::time::Instant;
use tokio::select;
use tokio::sync::Notify;
use crate::{models};
use crate::bg_workers::{ETU_REQUEST_INTERVAL, process_schedule_merge};
use crate::models::Db;

const SINGLE_GROUP_INTERVAL: i32 = 30;
const FORCE_REQ_CHANNEL_SIZE: usize = 50;

pub static MERGE_REQUEST_CHANNEL: OnceLock<tokio::sync::mpsc::Sender<i32>> = OnceLock::new();
pub static MERGE_REQUEST_CNT: AtomicUsize = AtomicUsize::new(0);

pub async fn priority_schedule_merge_task(con: Db, shutdown_notifier: Arc<Notify>) {
    let mut con = con.acquire().await.unwrap();
    // For demonstration, use a loop with a delay
    let (tx, mut rx) = tokio::sync::mpsc::channel(FORCE_REQ_CHANNEL_SIZE);
    MERGE_REQUEST_CHANNEL.set(tx).unwrap();

    // for balancing forced requests
    let mut last_etu_request = Instant::now() - tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL);
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
                                    warn!("PRIORITY_MERGE_TASK: Last merge for group {} was {} seconds ago, skipping...", request, time);
                                    continue;
                                }
                            },
                            None => {
                                warn!("PRIORITY_MERGE_TASK: Group schedule was never requested! Launching merge...");
                            }
                        }
                    },
                    Err(_) => {
                        error!("PRIORITY_MERGE_TASK: Non-existing group merge requested!");
                        continue;
                    }
                }

                if Instant::now() - last_etu_request < tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) {
                    warn!("PRIORITY_MERGE_TASK: Last ETU request was {} seconds ago, waiting...", (Instant::now() - last_etu_request).as_secs());
                    select!(
                        _ = tokio::time::sleep(tokio::time::Duration::from_secs(ETU_REQUEST_INTERVAL) - (Instant::now() - last_etu_request)) => {}
                        _ = shutdown_notifier.notified() => {
                            warn!("PRIORITY_MERGE_TASK: Shutdown notification recieved! exiting task...");
                            return
                        }
                    );
                }
                last_etu_request = Instant::now();

                process_schedule_merge(vec![request], &mut con).await;
            }
            _ = shutdown_notifier.notified() => {
                warn!("PRIORITY_MERGE_TASK: Shutdown notification recieved! exiting task...");
                return
            }
        );
    }
}