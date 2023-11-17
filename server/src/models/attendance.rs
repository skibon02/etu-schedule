use std::collections::BTreeMap;
use sqlx::pool::PoolConnection;
use sqlx::Sqlite;

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

    sqlx::query("INSERT INTO user_attendance_schedule (user_id, schedule_obj_time_link_id, enable_auto_attendance) VALUES (?, ?, ?) \
    ON CONFLICT(user_id, schedule_obj_time_link_id) DO UPDATE SET enable_auto_attendance = ?")
        .bind(user_id)
        .bind(schedule_obj_time_link_id)
        .bind(enable_auto_attendance)
        .bind(enable_auto_attendance)
        .execute(&mut *con).await?;


    Ok(())
}