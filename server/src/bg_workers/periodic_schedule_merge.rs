use std::sync::Arc;
use std::time::Instant;
use tokio::select;
use tokio::sync::Notify;
use crate::api::etu_api;
use crate::bg_workers::{ETU_REQUEST_INTERVAL, process_schedule_merge};
use crate::{data_merges, models};
use crate::models::Db;
use crate::models::groups::get_not_merged_sched_group_id_list;

const GROUPS_MERGE_INTERVAL: u64 = 60*5;

pub async fn periodic_schedule_merge_task(con: Db, shutdown_notifier: Arc<Notify>) {

    let mut con = con.acquire().await.unwrap();

    info!("PERIODIC_MERGE_TASK: Phase 1. Initial merge for all groups.");
    let new_groups = etu_api::get_groups_list().await;
    data_merges::groups::groups_merge(&new_groups, &mut *con).await.unwrap();

    while let Ok(groups) = get_not_merged_sched_group_id_list(&mut *con, 50).await {
        info!("PERIODIC_MERGE_TASK: received {} groups for merge", groups.len());
        process_schedule_merge(groups, &mut *con).await;
    }
    info!("PERIODIC_MERGE_TASK: Initial merge for all groups finished.");

    info!("PERIODIC_MERGE_TASK: Phase 2. Starting merge routine...");

    info!("PERIODIC_MERGE_TASK: starting merge routine...");
    loop {
        let group_id_range = models::groups::get_oldest_group_id_list(&mut con, 30).await.unwrap();

        process_schedule_merge(group_id_range, &mut con).await;


        select!(
            _ = tokio::time::sleep(tokio::time::Duration::from_secs(GROUPS_MERGE_INTERVAL)) => {}
            _ = shutdown_notifier.notified() => {
                warn!("PERIODIC_MERGE_TASK: Shutdown notification recieved! exiting task...");
                return
            }
        );
        info!("PERIODIC_MERGE_TASK: {} secs passed, starting merge routine...", GROUPS_MERGE_INTERVAL);

    }
}