use crate::api::etu_api;
use crate::bg_workers::process_schedule_merge;
use crate::{data_merges, models};
use sqlx::pool::PoolConnection;
use sqlx::Postgres;
use tokio::select;
use tokio::sync::watch::Receiver;

use crate::models::groups::get_not_merged_sched_group_id_list;

const GROUPS_MERGE_INTERVAL: u64 = 60 * 5;

pub async fn periodic_schedule_merge_task(
    mut con: &mut PoolConnection<Postgres>,
    mut shutdown_watcher: Receiver<bool>,
) {
    info!("PERIODIC_MERGE_TASK: Phase 1. Initial merge for all groups.");
    let new_groups = etu_api::get_groups_list().await.unwrap();
    data_merges::groups::groups_merge(&new_groups, &mut *con)
        .await
        .unwrap();

    while let Ok(groups) = get_not_merged_sched_group_id_list(&mut *con, 50).await {
        info!(
            "PERIODIC_MERGE_TASK: received {} groups for merge",
            groups.len()
        );
        process_schedule_merge(groups, &mut *con).await;
    }
    info!("PERIODIC_MERGE_TASK: Initial merge for all groups finished.");

    info!("PERIODIC_MERGE_TASK: Phase 2. Starting merge routine...");

    info!("PERIODIC_MERGE_TASK: starting merge routine...");
    loop {
        let group_id_range = models::groups::get_oldest_group_id_list(&mut con, 30)
            .await
            .unwrap();

        process_schedule_merge(group_id_range, &mut con).await;

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
