use anyhow::bail;
use std::collections::BTreeSet;
use std::sync::{Mutex, OnceLock};

use chrono::{DateTime, Datelike, NaiveTime, TimeDelta};
use chrono_tz::Tz;
use lazy_static::lazy_static;

use sqlx::pool::PoolConnection;
use sqlx::Postgres;
use tokio::select;
use tokio::sync::OnceCell;

use crate::api::etu_attendance_api::{CheckInResult, GetScheduleResult};
use crate::bg_workers::FailureDetector;
use crate::{api, models};
use tokio::sync::watch::Receiver;

fn time_to_lesson_time_num(time: NaiveTime) -> Option<i32> {
    let mut lesson_time_ranges = [
        NaiveTime::from_hms_opt(8, 0, 0).unwrap()..NaiveTime::from_hms_opt(9, 30, 0).unwrap(),
        NaiveTime::from_hms_opt(9, 50, 0).unwrap()..NaiveTime::from_hms_opt(11, 20, 0).unwrap(),
        NaiveTime::from_hms_opt(11, 40, 0).unwrap()..NaiveTime::from_hms_opt(13, 10, 0).unwrap(),
        NaiveTime::from_hms_opt(13, 40, 0).unwrap()..NaiveTime::from_hms_opt(15, 10, 0).unwrap(),
        NaiveTime::from_hms_opt(15, 30, 0).unwrap()..NaiveTime::from_hms_opt(17, 0, 0).unwrap(),
        NaiveTime::from_hms_opt(17, 20, 0).unwrap()..NaiveTime::from_hms_opt(18, 50, 0).unwrap(),
        NaiveTime::from_hms_opt(19, 5, 0).unwrap()..NaiveTime::from_hms_opt(20, 35, 0).unwrap(),
        NaiveTime::from_hms_opt(20, 50, 0).unwrap()..NaiveTime::from_hms_opt(22, 20, 0).unwrap(),
    ];

    let mut lesson_time_num = None;
    for (i, lesson_time_range) in lesson_time_ranges.iter_mut().enumerate() {
        if lesson_time_range.contains(&time) {
            lesson_time_num = Some(i as i32);
            break;
        }
    }
    lesson_time_num
}

pub async fn attendance_worker_task(
    con: &mut PoolConnection<Postgres>,
    mut shutdown_watcher: Receiver<bool>,
) {
    //test attendance

    // let token = "s%3ATxJu9AAItcHgZne_fGX4TJkHgEjL3XzK.WeP0viYduOVh4%2BUJ90Jwf%2Fe5gEhYKULZs45P1Gx2%2F6E";
    // let schedule_test = api::etu_attendance_api::get_cur_schedule(token.to_string()).await.unwrap();
    // info!("schedule_test: {:#?}", schedule_test);

    // let check_in_test = api::etu_attendance_api::check_in(token.to_string(), 32).await;
    // info!("check_in_test: {:#?}", check_in_test);

    let etu_semester_start = api::etu_attendance_api::get_semester_info()
        .await
        .unwrap()
        .start_date;
    let semester_start: DateTime<Tz> = DateTime::parse_from_rfc3339(&etu_semester_start)
        .unwrap()
        .with_timezone(&chrono_tz::Europe::Moscow);

    info!(
        "ATTENDANCE_WORKER_TASK: Semester start from etu: {:#?}",
        etu_semester_start
    );

    let day_of_week = semester_start.weekday().num_days_from_monday() as u64;
    let semester_start_week = semester_start
        .checked_sub_days(chrono::Days::new(day_of_week))
        .unwrap();

    info!(
        "ATTENDANCE_WORKER_TASK: Semester start: {:#?}",
        semester_start
    );
    info!(
        "ATTENDANCE_WORKER_TASK: Semester start week: {:#?}",
        semester_start_week
    );

    // Set of processed check_ins:
    // user_id, time_link_id, week_num
    let mut processed_check_ins = BTreeSet::<(i32, i32, i32)>::new();

    let mut fail_detector = FailureDetector::new(10, 30);
    loop {
        select!(
            _ = tokio::time::sleep(tokio::time::Duration::from_secs(60)) => {
                if let Err(e) = attendance_set_marks(semester_start_week, &mut *con, &mut processed_check_ins).await {
                    error!("ATTENDANCE_WORKER_TASK: attendance_set_marks failed: {:#?}", e);
                    if fail_detector.failure() {
                        error!("ATTENDANCE_WORKER_TASK: attendance_set_marks failed too many times. Exiting task...");
                        return;
                    }
                }
                else {
                    fail_detector.success();
                }
            }
            _ = shutdown_watcher.changed() => {
                warn!("ATTENDANCE_WORKER_TASK: Shutdown notification recieved! exiting task attendance_worker_task...");
                return;
            }
        );
    }
}

static SERVER_TIME_DIFF: OnceCell<TimeDelta> = OnceCell::const_new();

/// Attendance set marks algorithm:
/// 1. Get exact current lessons for users with attendance enabled and token valid for CURRENT time (does nothing between lessons)
/// 2. Get current schedule from ETU attendance system for each user
/// 3. Check if there is a lesson in current schedule that matches the lesson from our system
/// 4. If there is a match, check in for this lesson
pub async fn attendance_set_marks(
    semester_start_week: chrono::DateTime<chrono_tz::Tz>,
    con: &mut PoolConnection<Postgres>,
    processed_check_ins: &mut BTreeSet<(i32, i32, i32)>,
) -> anyhow::Result<()> {
    debug!("ATTENDANCE_WORKER_TASK: 60 secs passed, starting attendance worker routine...");
    let time_diff = SERVER_TIME_DIFF
        .get_or_init(|| async {
            let time = api::etu_attendance_api::get_time().await.unwrap();
            let server_time = DateTime::parse_from_rfc3339(&time.time)
                .unwrap()
                .with_timezone(&chrono_tz::Europe::Moscow);
            let local_time = chrono::Utc::now().with_timezone(&chrono_tz::Europe::Moscow);
            server_time - local_time
        })
        .await;

    let server_time = chrono::Utc::now().with_timezone(&chrono_tz::Europe::Moscow) + *time_diff;

    let day_of_week = server_time.weekday().num_days_from_monday() as u64;
    let day_of_week = models::schedule::WeekDay::try_from(day_of_week as u32).unwrap();
    let week_num = (server_time - semester_start_week).num_weeks();
    let lesson_time_num = time_to_lesson_time_num(server_time.time());
    let Some(lesson_time_num) = lesson_time_num else {
        debug!("No lesson at this time! Skipping...");
        return Ok(());
    };

    debug!(
        "Ready for attendance check! Current time: {:#?}",
        server_time
    );
    // debug!("day_of_week: {:#?}", day_of_week);
    // debug!("week_num: {:#?}", week_num);
    debug!("lesson_time_num: {:#?}", lesson_time_num);
    // debug!("Time: {:#?}", local_time.time());

    let (user_schedule_info, subjects) = models::attendance::get_current_pending_attendance_marks(
        &mut *con,
        week_num,
        day_of_week,
        lesson_time_num,
    )
    .await?;
    trace!("objs: {:#?}", user_schedule_info);
    'users: for user_schedule in user_schedule_info {
        //wait 5s
        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

        debug!("Start processing user {}", user_schedule.user_id);

        // early exit if checks are already processed
        let mut need_to_check_in = false;
        for (time_link_id, _) in &user_schedule.attend_lessons {
            if !processed_check_ins.contains(&(
                user_schedule.user_id,
                *time_link_id,
                week_num as i32,
            )) {
                need_to_check_in = true;
                break;
            }
        }

        if !need_to_check_in {
            debug!("Early leaving! All marks are set");
            continue;
        }

        let Some(token) = user_schedule.user_data.clone().attendance_token else {
            warn!("User {} has no attendance token!", user_schedule.user_id);
            continue;
        };

        //make request
        let etu_schedule = api::etu_attendance_api::get_cur_schedule(token.clone()).await?;
        if let GetScheduleResult::WrongToken = etu_schedule {
            warn!(
                "Wrong token for user_id: {:?} (group_id: {:?})! Invalidating user token...",
                user_schedule.user_data.user_id, user_schedule.user_data.group_id
            );
            models::users::invalidate_attendance_token(&mut *con, user_schedule.user_id).await?;
            continue;
        }
        let GetScheduleResult::Ok(etu_schedule) = etu_schedule else {
            error!(
                "Failed to get schedule for user_id: {:?} (group_id: {:?})! Unknown response: {:?}",
                user_schedule.user_data.user_id, user_schedule.user_data.group_id, etu_schedule
            );
            continue;
        };
        // debug!("schedule received from ETU: {:?}", etu_schedule);

        // otherwise, get etu_schedule to associate with saved local schedule and to get ids for check_in
        let current_subjects_etu: Vec<_> = etu_schedule
            .iter()
            .filter(|x| {
                DateTime::parse_from_rfc3339(&x.check_in_start)
                    .unwrap()
                    .with_timezone(&chrono_tz::Europe::Moscow)
                    <= server_time
                    && DateTime::parse_from_rfc3339(&x.check_in_deadline)
                        .unwrap()
                        .with_timezone(&chrono_tz::Europe::Moscow)
                        >= server_time
            })
            .collect();

        info!(
            "ATTENDANCE_WORKER_TASK: User_id: {:?} (group_id: {:?}), user_schedule.attend_lessons: {:#?}",
            user_schedule.user_data.user_id,
            user_schedule.user_data.group_id,
            user_schedule
                .attend_lessons
                .iter()
                .map(|(_, subject_id)| {
                    let subject = subjects.get(subject_id).unwrap();
                    subject.title.clone()
                })
                .collect::<Vec<_>>()
        );

        //iterate over lessons. Most probably we will have single lesson here
        '_lessons: for (time_link_id, subject_id) in user_schedule.attend_lessons {
            let subject_title = subjects[&subject_id].title.clone();
            let subject_type = subjects[&subject_id].subject_type.clone();
            let short_title = subjects[&subject_id].short_title.clone();

            if processed_check_ins.contains(&(user_schedule.user_id, time_link_id, week_num as i32))
            {
                debug!("Check in for user_id: {:?} (group_id: {:?}), time_link_id: {:?} already processed! Skipping...", user_schedule.user_data.user_id, user_schedule.user_data.group_id, time_link_id);
                continue;
            }

            info!(
                "ATTENDANCE_WORKER_TASK: finding match for subject_title: {:#?}...",
                subject_title
            );
            let mut found_id = None;
            for current_subject in &current_subjects_etu {
                if current_subject.lesson.title == subject_title
                    && current_subject.lesson.subject_type == subject_type
                    && current_subject.lesson.short_title == short_title
                {
                    found_id = Some(current_subject.id);
                    break;
                }
            }
            if let Some(id) = found_id {
                info!(
                    "ATTENDANCE_WORKER_TASK: Found subject from attendance system: {:#?}",
                    id
                );
                info!("ATTENDANCE_WORKER_TASK: Processing check_in...");
                let check_in_res = api::etu_attendance_api::check_in(token.clone(), id).await?;
                match check_in_res {
                    CheckInResult::Ok => {
                        info!("Check in success!");
                        // models::attendance::set_attendance_mark(&mut *trx, time_link_id, true).await.unwrap();
                        processed_check_ins.insert((
                            user_schedule.user_id,
                            time_link_id,
                            week_num as i32,
                        ));
                    }
                    CheckInResult::WrongToken => {
                        warn!("Wrong token for user_id: {:?} (group_id: {:?})! Invalidating user token...",
                                        user_schedule.user_data.user_id, user_schedule.user_data.group_id);
                        models::users::invalidate_attendance_token(
                            &mut *con,
                            user_schedule.user_id,
                        )
                        .await?;
                        continue 'users;
                    }
                    other => {
                        bail!("Check in failed: Unknown response: {:#?}", other);
                    }
                }
            } else {
                warn!("Failed to find subject from attendance system!");
            }
        }
    }

    Ok(())
}
