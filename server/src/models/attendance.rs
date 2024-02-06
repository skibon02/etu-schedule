use crate::models;
use crate::models::schedule::WeekDay;
use crate::models::subjects::SubjectModel;
use crate::models::users::UserDataModel;
use crate::models::DbResult;
use sqlx::{Connection, PgConnection};
use std::collections::btree_map::Entry::Vacant;
use std::collections::BTreeMap;

#[derive(sqlx::FromRow)]
pub struct UserAttendanceScheduleModel {
    pub user_id: i32,
    pub schedule_obj_time_link_id: i32,
    pub enable_auto_attendance: bool,
}
pub async fn get_attendance_schedule(
    con: &mut PgConnection,
    user_id: i32,
) -> DbResult<BTreeMap<i32, bool>> {
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

pub async fn set_attendance_schedule(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_id: i32,
    enable_auto_attendance: bool,
) -> DbResult<()> {
    con.transaction(|tr| Box::pin(async move {
        //check old value
        let old_value: Option<bool> = sqlx::query_scalar!("SELECT enable_auto_attendance FROM user_attendance_schedule WHERE user_id = $1 AND schedule_obj_time_link_id = $2",
        user_id, schedule_obj_time_link_id)
            .fetch_optional(&mut **tr).await?;

        if old_value.is_some() && old_value.unwrap() == enable_auto_attendance {
            debug!("Skipping setting attendance schedule for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);

            return Ok(());
        }

        sqlx::query!("INSERT INTO user_attendance_schedule (user_id, schedule_obj_time_link_id, enable_auto_attendance) VALUES ($1, $2, $3) \
    ON CONFLICT(user_id, schedule_obj_time_link_id) DO UPDATE SET enable_auto_attendance = $4",
        user_id, schedule_obj_time_link_id, enable_auto_attendance, enable_auto_attendance)
            .execute(&mut **tr).await?;

        //invalidate diffs with old value
        debug!("Invalidating diffs for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);
        sqlx::query!("DELETE FROM user_attendance_schedule_diffs WHERE user_id = $1 \
        AND schedule_obj_time_link_id = $2 AND enable_auto_attendance = $3",
            user_id, schedule_obj_time_link_id, enable_auto_attendance)
            .execute(&mut **tr).await?;

        Ok(())
    })).await
}

pub async fn set_attendance_schedule_all(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_ids: Vec<i32>,
    enable_auto_attendance: bool,
) -> DbResult<()> {
    con.transaction(|tr| Box::pin(async move {
        for schedule_obj_time_link_id in schedule_obj_time_link_ids {
            sqlx::query!("INSERT INTO user_attendance_schedule (user_id, schedule_obj_time_link_id, enable_auto_attendance) VALUES ($1, $2, $3) \
    ON CONFLICT(user_id, schedule_obj_time_link_id) DO UPDATE SET enable_auto_attendance = $4",
        user_id, schedule_obj_time_link_id, enable_auto_attendance, enable_auto_attendance)
                .execute(&mut **tr).await?;

            //invalidate diffs with old value
            debug!("Invalidating diffs for user {} with schedule_obj_time_link_id {} and value {}", user_id, schedule_obj_time_link_id, enable_auto_attendance);
            sqlx::query!("DELETE FROM user_attendance_schedule_diffs WHERE user_id = $1 \
        AND schedule_obj_time_link_id = $2 AND enable_auto_attendance = $3",
            user_id, schedule_obj_time_link_id, enable_auto_attendance)
                .execute(&mut **tr).await?;
        }

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

pub async fn get_attendance_schedule_diffs(
    con: &mut PgConnection,
    user_id: i32,
) -> DbResult<BTreeMap<i32, Vec<(bool, i32)>>> {
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
        map.entry(item.schedule_obj_time_link_id)
            .or_default()
            .push((item.enable_auto_attendance, item.week_num));
    }

    Ok(map)
}

pub async fn set_attendance_schedule_diff(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_id: i32,
    enable_auto_attendance: bool,
    week_num: i32,
) -> DbResult<()> {
    // get current value for attendance schedule
    let current_value: Option<bool> = sqlx::query_scalar!(
        "SELECT enable_auto_attendance \
    FROM user_attendance_schedule WHERE user_id = $1 AND schedule_obj_time_link_id = $2",
        user_id,
        schedule_obj_time_link_id
    )
    .fetch_optional(&mut *con)
    .await?;

    if current_value.is_some() && current_value.unwrap() == enable_auto_attendance {
        //delete entry as redundant
        debug!("Deleting entry for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, enable_auto_attendance);
        sqlx::query!(
            "DELETE FROM user_attendance_schedule_diffs WHERE user_id = $1 \
        AND schedule_obj_time_link_id = $2 AND week_num = $3",
            user_id,
            schedule_obj_time_link_id,
            week_num
        )
        .execute(&mut *con)
        .await?;
    } else {
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

/// Panicking!
/// Panic if user doesn't have attendance token set
pub async fn get_active_attendance_objs_at_time(
    con: &mut PgConnection,
    user_id: i32,
    week: i64,
    week_parity: String,
    week_day: WeekDay,
    time: i32,
) -> DbResult<Vec<(i32, i32)>> {
    let user_group = models::users::get_user_group(con, user_id)
        .await?
        .unwrap()
        .group_id;
    // trace!("DEBUG: get_active_attendance_objs_at_time call!\n\tuser_id: {},\n\tweek: {}, \n\tweek_parity: {}, \n\tweek_day: {:?},\n\ttime: {}", user_id,
    // week, week_parity, week_day, time);
    let res = sqlx::query!("SELECT schedule_objs.time_link_id, schedule_objs.subject_id FROM schedule_objs \
    WHERE schedule_objs.group_id = $5 AND schedule_objs.time = $4 AND week_day = $3 AND week_parity = $6 AND \
    schedule_objs.gen_end IS NULL AND \
    CASE WHEN EXISTS(SELECT enable_auto_attendance FROM user_attendance_schedule_diffs \
    WHERE user_id = $1 AND week_num = $2 AND schedule_objs.time_link_id = user_attendance_schedule_diffs.schedule_obj_time_link_id)\
    THEN (SELECT enable_auto_attendance FROM user_attendance_schedule_diffs \
    WHERE user_id = $1 AND week_num = $2 AND schedule_objs.time_link_id = user_attendance_schedule_diffs.schedule_obj_time_link_id)
    ELSE (SELECT enable_auto_attendance FROM user_attendance_schedule \
    WHERE user_id = $1 AND schedule_objs.time_link_id = user_attendance_schedule.schedule_obj_time_link_id) END",
    user_id, week as i32, week_day as WeekDay, time, user_group, week_parity)
        .fetch_all(&mut *con).await?;

    Ok(res.iter().map(|x| (x.time_link_id, x.subject_id)).collect())
}

#[derive(Debug)]
pub struct UserAttendanceScheduleInfo {
    pub user_id: i32,
    pub user_data: UserDataModel,
    // time_link_id, subject_id
    pub attend_lessons: Vec<(i32, i32)>,
}

/// Requires external transaction!
pub async fn get_current_pending_attendance_marks(
    con: &mut PgConnection,
    week: i64,
    week_day: WeekDay,
    time: i32,
) -> DbResult<(Vec<UserAttendanceScheduleInfo>, BTreeMap<i32, SubjectModel>)> {
    let week_parity = if week % 2 == 0 {
        "1".to_string()
    } else {
        "2".to_string()
    };
    info!(
        "get_current_pending_attendance_marks: using week_parity: {}",
        week_parity
    );

    // get users with attendance enabled
    let users: Vec<i32> = sqlx::query_scalar!(
        "SELECT user_id FROM user_data \
    WHERE attendance_token IS NOT NULL"
    )
    .fetch_all(&mut *con)
    .await?;

    let mut res = Vec::new();
    let mut subjects = BTreeMap::new();

    // get schedule for users
    for user in users {
        let user_schedule = get_active_attendance_objs_at_time(
            con,
            user,
            week,
            week_parity.clone(),
            week_day,
            time,
        )
        .await?;
        let user_data = models::users::get_user_data(con, user).await?;
        for (_, subject_id) in &user_schedule {
            if let Vacant(e) = subjects.entry(*subject_id) {
                let subject = models::subjects::get_active_subject_by_id(*subject_id, con)
                    .await?
                    .unwrap();
                e.insert(subject);
            }
        }
        res.push(UserAttendanceScheduleInfo {
            user_id: user,
            user_data,
            attend_lessons: user_schedule,
        });
    }

    Ok((res, subjects))
}
