use crate::api::etu_api;
use crate::bg_workers::{process_schedule_merge, FailureDetector};
use crate::{data_merges, models};
use sqlx::pool::PoolConnection;
use sqlx::Postgres;
use tokio::select;
use tokio::sync::watch::Receiver;

use crate::models::groups::get_not_merged_sched_group_id_list;

const GROUPS_MERGE_INTERVAL: u64 = 60 * 5;

pub async fn periodic_schedule_merge_task(
    con: &mut PoolConnection<Postgres>,
    mut shutdown_watcher: Receiver<bool>,
) {
    info!("PERIODIC_MERGE_TASK: Phase 0. Groups merge.");
    let mut fail_detector = FailureDetector::new(10, 30);
    loop {
        let new_groups = etu_api::get_groups_list().await;
        match new_groups {
            Ok(new_groups) => {
                if data_merges::groups::groups_merge(&new_groups, &mut *con)
                    .await
                    .is_ok()
                {
                    break;
                }
            }
            Err(e) => {
                warn!("PERIODIC_MERGE_TASK: Failed to get groups list: {}", e);
                if fail_detector.failure() {
                    warn!("PERIODIC_MERGE_TASK: Too many failures. Exiting task...");
                    return;
                }
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    }
    fail_detector.reset();
    info!("PERIODIC_MERGE_TASK: Groups merge finished.");

    info!("PERIODIC_MERGE_TASK: Phase 1. Initial merge for all groups.");

    while let Ok(groups) = get_not_merged_sched_group_id_list(&mut *con, 50).await {
        info!(
            "PERIODIC_MERGE_TASK: received {} groups for merge",
            groups.len()
        );
        if let Err(e) = process_schedule_merge(groups, &mut *con).await {
            warn!(
                "PERIODIC_MERGE_TASK: Failed to merge groups: {}. Skipping",
                e
            );
            if fail_detector.failure() {
                warn!("PERIODIC_MERGE_TASK: Too many failures. Exiting task...");
                return;
            }
        } else {
            fail_detector.success();
        }
        if shutdown_watcher.has_changed().unwrap() {
            warn!("PERIODIC_MERGE_TASK: Shutdown notification recieved! exiting task...");
            return;
        }
    }
    fail_detector.reset();
    info!("PERIODIC_MERGE_TASK: Initial merge for all groups finished.");

    info!("PERIODIC_MERGE_TASK: Phase 2. Starting merge routine...");

    info!("PERIODIC_MERGE_TASK: starting merge routine...");
    loop {
        let Ok(group_id_range) = models::groups::get_oldest_group_id_list(con, 30)
            .await
            .map_err(|e| warn!("PERIODIC_MERGE_TASK: Failed to get group id list: {}", e))
        else {
            continue;
        };

        if let Err(e) = process_schedule_merge(group_id_range, con).await {
            warn!(
                "PERIODIC_MERGE_TASK: Failed to merge groups: {}. Skipping",
                e
            );
            if fail_detector.failure() {
                warn!("PERIODIC_MERGE_TASK: Failed to merge groups 5 times. Exiting task...");
                return;
            }
        } else {
            fail_detector.success();
        }

        select!(
            _ = tokio::time::sleep(tokio::time::Duration::from_secs(GROUPS_MERGE_INTERVAL)) => {}
            _ = shutdown_watcher.changed() => {
                warn!("PERIODIC_MERGE_TASK: Shutdown notification recieved! exiting task...");
                return
            }
        );
        info!(
            "PERIODIC_MERGE_TASK: {} secs passed, starting merge routine...",
            GROUPS_MERGE_INTERVAL
        );
    }
}
