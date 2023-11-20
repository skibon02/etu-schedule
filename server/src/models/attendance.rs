use std::collections::BTreeMap;
use std::thread::yield_now;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, Sqlite};

#[derive(sqlx::FromRow)]
pub struct UserAttendanceScheduleModel {
    pub user_id: u32,
    pub schedule_obj_time_link_id: u32,
    pub enable_auto_attendance: bool,
}
pub async fn get_attendance_schedule(con: &mut PoolConnection<Sqlite>, user_id: u32) -> anyhow::Result<BTreeMap<u32, bool>> {
    let res = sqlx::query_as::<_, UserAttendanceScheduleModel>(
        "SELECT * FROM user_attendance_schedule join schedule_objs \
        on user_attendance_schedule.schedule_obj_time_link_id = schedule_objs.link_id WHERE user_id = ? AND gen_end IS NULL",
    )
        .bind(user_id)
        .fetch_all(&mut *con).await?;

    let mut map = BTreeMap::new();
    for item in res {
        map.insert(item.schedule_obj_time_link_id, item.enable_auto_attendance);
    }

    Ok(map)
}


pub async fn set_attendance_schedule(con: &mut PoolConnection<Sqlite>, user_id: u32,
                                     schedule_obj_time_link_id: u32, enable_auto_attendance: bool) -> anyhow::Result<()> {
    let mut transaction = con.begin().await?;

    //check old value
    let old_value: Option<bool> = sqlx::query_scalar("SELECT enable_auto_attendance FROM user_attendance_schedule WHERE user_id = ? AND schedule_obj_time_link_id = ?")
        .bind(user_id)
        .bind(schedule_obj_time_link_id)
        .fetch_optional(&mut transaction).await?;

    if old_value.is_some() && old_value.unwrap() == enable_auto_attendance {
        debug!("Skipping setting attendance schedule for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);
        return Ok(());
    }

    sqlx::query("INSERT INTO user_attendance_schedule (user_id, schedule_obj_time_link_id, enable_auto_attendance) VALUES (?, ?, ?) \
    ON CONFLICT(user_id, schedule_obj_time_link_id) DO UPDATE SET enable_auto_attendance = ?")
        .bind(user_id)
        .bind(schedule_obj_time_link_id)
        .bind(enable_auto_attendance)
        .bind(enable_auto_attendance)
        .execute(&mut transaction).await?;

    //invalidate diffs with old value
    debug!("Invalidating diffs for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);
    sqlx::query("DELETE FROM user_attendance_schedule_diffs WHERE user_id = ? AND schedule_obj_time_link_id = ? AND enable_auto_attendance = ?")
        .bind(user_id)
        .bind(schedule_obj_time_link_id)
        .bind(enable_auto_attendance)
        .execute(&mut transaction).await?;

    transaction.commit().await?;

    Ok(())
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserAttendanceScheduleDiffsModel {
    pub user_id: u32,
    pub schedule_obj_time_link_id: u32,
    pub week_num: u32,
    pub enable_auto_attendance: bool,
}

pub async fn get_attendance_schedule_diffs(con: &mut PoolConnection<Sqlite>, user_id: u32) -> anyhow::Result<BTreeMap<u32, Vec<(bool, u32)>>> {
    let res = sqlx::query_as::<_, UserAttendanceScheduleDiffsModel>(
        "SELECT * FROM user_attendance_schedule_diffs join schedule_objs \
        on user_attendance_schedule_diffs.schedule_obj_time_link_id = schedule_objs.link_id WHERE user_id = ? AND gen_end IS NULL",
    )
        .bind(user_id)
        .fetch_all(&mut *con).await?;

    // link_id: (enable_auto_attendance, week_num)*
    let mut map: BTreeMap<u32, Vec<(bool, u32)>> = BTreeMap::new();
    for item in res {
        map.entry(item.schedule_obj_time_link_id).or_default().push((item.enable_auto_attendance, item.week_num));
    }

    Ok(map)
}

pub async fn set_attendance_schedule_diff(con: &mut PoolConnection<Sqlite>, user_id: u32,
                                           schedule_obj_time_link_id: u32, enable_auto_attendance: bool, week_num: u32) -> anyhow::Result<()> {
    // get current value for attendance schedule
    let current_value: Option<bool> = sqlx::query_scalar("SELECT enable_auto_attendance FROM user_attendance_schedule WHERE user_id = ? AND schedule_obj_time_link_id = ?")
        .bind(user_id)
        .bind(schedule_obj_time_link_id)
        .fetch_optional(&mut *con).await?;

    if current_value.is_some() && current_value.unwrap() == enable_auto_attendance {
        //delete entry as redundant
        debug!("Deleting entry for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, enable_auto_attendance);
        sqlx::query("DELETE FROM user_attendance_schedule_diffs WHERE user_id = ? AND schedule_obj_time_link_id = ? AND week_num = ?")
            .bind(user_id)
            .bind(schedule_obj_time_link_id)
            .bind(week_num)
            .execute(&mut *con).await?;
    }
    else {
        //insert entry
        debug!("Inserting entry for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, enable_auto_attendance);
        sqlx::query("INSERT INTO user_attendance_schedule_diffs (user_id, schedule_obj_time_link_id, enable_auto_attendance, week_num) VALUES (?, ?, ?, ?) \
        ON CONFLICT(user_id, schedule_obj_time_link_id, week_num) DO UPDATE SET enable_auto_attendance = ?")
            .bind(user_id)
            .bind(schedule_obj_time_link_id)
            .bind(enable_auto_attendance)
            .bind(week_num)
            .bind(enable_auto_attendance)
            .execute(&mut *con).await?;
    }


    Ok(())
}
//
// pub async fn test_long_req(con: &mut PoolConnection<Sqlite>) {
//     let con = con.acquire().await.unwrap();
//     println!("Connection has been acquired! waiting...");
//     tokio::time::sleep(std::time::Duration::from_secs(1)).await;
//     // con.commit().await.unwrap();
//     println!("Connection has been released.")
//
// }