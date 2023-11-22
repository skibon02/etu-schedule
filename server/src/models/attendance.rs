use std::collections::BTreeMap;
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, Connection, Postgres};

#[derive(sqlx::FromRow)]
pub struct UserAttendanceScheduleModel {
    pub user_id: i32,
    pub schedule_obj_time_link_id: i32,
    pub enable_auto_attendance: bool,
}
pub async fn get_attendance_schedule(con: &mut PoolConnection<Postgres>, user_id: i32) -> anyhow::Result<BTreeMap<i32, bool>> {
    let res = sqlx::query_as!(
        UserAttendanceScheduleModel,
        "SELECT user_attendance_schedule.* FROM user_attendance_schedule join schedule_objs \
        on user_attendance_schedule.schedule_obj_time_link_id = schedule_objs.time_link_id WHERE user_id = $1 AND gen_end IS NULL",
        user_id)
        .fetch_all(&mut *con).await?;

    let mut map = BTreeMap::new();
    for item in res {
        map.insert(item.schedule_obj_time_link_id, item.enable_auto_attendance);
    }

    Ok(map)
}


pub async fn set_attendance_schedule(con: &mut PoolConnection<Postgres>, user_id: i32,
                                     schedule_obj_time_link_id: i32, enable_auto_attendance: bool) -> anyhow::Result<()> {

    con.transaction(|tr| Box::pin(async move {
        //check old value
        let old_value: Option<bool> = sqlx::query_scalar!("SELECT enable_auto_attendance FROM user_attendance_schedule WHERE user_id = $1 AND schedule_obj_time_link_id = $2",
        user_id, schedule_obj_time_link_id)
            .fetch_optional(&mut *tr).await?;

        if old_value.is_some() && old_value.unwrap() == enable_auto_attendance {
            debug!("Skipping setting attendance schedule for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);

            return Ok(());
        }

        sqlx::query!("INSERT INTO user_attendance_schedule (user_id, schedule_obj_time_link_id, enable_auto_attendance) VALUES ($1, $2, $3) \
    ON CONFLICT(user_id, schedule_obj_time_link_id) DO UPDATE SET enable_auto_attendance = $4",
        user_id, schedule_obj_time_link_id, enable_auto_attendance, enable_auto_attendance)
            .execute(&mut *tr).await?;

        //invalidate diffs with old value
        debug!("Invalidating diffs for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);
        sqlx::query!("DELETE FROM user_attendance_schedule_diffs WHERE user_id = $1 \
        AND schedule_obj_time_link_id = $2 AND enable_auto_attendance = $3",
            user_id, schedule_obj_time_link_id, enable_auto_attendance)
            .execute(&mut *tr).await?;

        Ok(())
    })).await
}

#[derive(sqlx::FromRow, Debug)]
pub struct UserAttendanceScheduleDiffsModel {
    pub user_id: i32,
    pub schedule_obj_time_link_id: i32,
    pub week_num: i32,
    pub enable_auto_attendance: bool,
}

pub async fn get_attendance_schedule_diffs(con: &mut PoolConnection<Postgres>, user_id: i32) -> anyhow::Result<BTreeMap<i32, Vec<(bool, i32)>>> {
    let res = sqlx::query_as!(UserAttendanceScheduleDiffsModel,
        "SELECT user_attendance_schedule_diffs.* FROM user_attendance_schedule_diffs join schedule_objs \
        on user_attendance_schedule_diffs.schedule_obj_time_link_id = schedule_objs.time_link_id \
        WHERE user_id = $1 AND gen_end IS NULL",
        user_id
    )
        .fetch_all(&mut *con).await?;

    // link_id: (enable_auto_attendance, week_num)*
    let mut map: BTreeMap<i32, Vec<(bool, i32)>> = BTreeMap::new();
    for item in res {
        map.entry(item.schedule_obj_time_link_id).or_default().push((item.enable_auto_attendance, item.week_num));
    }

    Ok(map)
}

pub async fn set_attendance_schedule_diff(con: &mut PoolConnection<Postgres>, user_id: i32,
                                           schedule_obj_time_link_id: i32, enable_auto_attendance: bool, week_num: i32) -> anyhow::Result<()> {
    // get current value for attendance schedule
    let current_value: Option<bool> = sqlx::query_scalar!("SELECT enable_auto_attendance \
    FROM user_attendance_schedule WHERE user_id = $1 AND schedule_obj_time_link_id = $2",
        user_id, schedule_obj_time_link_id)
        .fetch_optional(&mut *con).await?;

    if current_value.is_some() && current_value.unwrap() == enable_auto_attendance {
        //delete entry as redundant
        debug!("Deleting entry for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, enable_auto_attendance);
        sqlx::query!("DELETE FROM user_attendance_schedule_diffs WHERE user_id = $1 \
        AND schedule_obj_time_link_id = $2 AND week_num = $3",
            user_id, schedule_obj_time_link_id, week_num)
            .execute(&mut *con).await?;
    }
    else {
        //insert entry
        debug!("Inserting entry for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, enable_auto_attendance);
        sqlx::query!("INSERT INTO user_attendance_schedule_diffs (user_id, schedule_obj_time_link_id, enable_auto_attendance, week_num) \
        VALUES ($1, $2, $3, $4) \
        ON CONFLICT(user_id, schedule_obj_time_link_id, week_num) DO UPDATE SET enable_auto_attendance = $3",
            user_id, schedule_obj_time_link_id, enable_auto_attendance, week_num)
            .execute(&mut *con).await?;
    }


    Ok(())
}