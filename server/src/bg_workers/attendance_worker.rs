use std::collections::BTreeSet;
use std::sync::Arc;
use anyhow::Context;
use chrono::{Datelike, NaiveTime, Timelike, TimeZone};
use chrono_tz::Tz;
use sqlx::{Connection, Postgres};
use sqlx::pool::PoolConnection;
use tokio::select;
use tokio::sync::Notify;
use crate::{api, models};
use crate::api::etu_attendance_api::{CheckInResult, GetScheduleResult};
use crate::models::Db;

fn time_to_lesson_time_num(time: NaiveTime) -> Option<i32> {
    let mut lesson_time_ranges = vec![
        NaiveTime::from_hms_opt(8, 0, 0).unwrap()..NaiveTime::from_hms_opt(9, 30, 0).unwrap(),
        NaiveTime::from_hms_opt(9, 50, 0).unwrap()..NaiveTime::from_hms_opt(11, 20, 0).unwrap(),
        NaiveTime::from_hms_opt(11, 40, 0).unwrap()..NaiveTime::from_hms_opt(13, 10, 0).unwrap(),
        NaiveTime::from_hms_opt(13, 40, 0).unwrap()..NaiveTime::from_hms_opt(15, 10, 0).unwrap(),
        NaiveTime::from_hms_opt(15, 30, 0).unwrap()..NaiveTime::from_hms_opt(17, 0, 0).unwrap(),
        NaiveTime::from_hms_opt(17, 20, 0).unwrap()..NaiveTime::from_hms_opt(18, 50, 0).unwrap(),
        NaiveTime::from_hms_opt(19, 05, 0).unwrap()..NaiveTime::from_hms_opt(20, 35, 0).unwrap(),
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

pub async fn attendance_worker_task(mut con: &mut PoolConnection<Postgres>, shutdown_notifier: Arc<Notify>) {

    //test attendance

    // let token = "s%3ATxJu9AAItcHgZne_fGX4TJkHgEjL3XzK.WeP0viYduOVh4%2BUJ90Jwf%2Fe5gEhYKULZs45P1Gx2%2F6E";
    // let schedule_test = api::etu_attendance_api::get_cur_schedule(token.to_string()).await.unwrap();
    // info!("schedule_test: {:#?}", schedule_test);


    // let check_in_test = api::etu_attendance_api::check_in(token.to_string(), 32).await;
    // info!("check_in_test: {:#?}", check_in_test);

    let semester_start = chrono_tz::Europe::Moscow.with_ymd_and_hms(2023, 9, 1, 0, 0, 0).unwrap();
    let day_of_week = semester_start.weekday().num_days_from_monday() as u64;
    let semester_start_week = semester_start.checked_sub_days(chrono::Days::new(day_of_week)).unwrap();

    warn!("Semester start: {:#?}", semester_start);
    warn!("Semester start week: {:#?}", semester_start_week);

    /// Set of processed check_ins:
    /// user_id, time_link_id, week_num
    let mut processed_check_ins = BTreeSet::<(i32, i32, i32)>::new();

    loop {
        select!(
            _ = tokio::time::sleep(tokio::time::Duration::from_secs(60)) => {
                info!("ATTENDANCE_WORKER_TASK: 60 secs passed, starting attendance worker routine...");
                let time = api::etu_attendance_api::get_time().await.unwrap();

                let local_time_utc = time.time.parse::<chrono::DateTime<chrono::Utc>>().unwrap();

                let local_time = local_time_utc.with_timezone(&chrono_tz::Europe::Moscow);
                let day_of_week = local_time.weekday().num_days_from_monday() as u64;
                let day_of_week = models::schedule::WeekDay::try_from(day_of_week as u32).unwrap();
                let week_parity = time.week;
                let week_num = (local_time - semester_start_week).num_weeks();
                let lesson_time_num = time_to_lesson_time_num(local_time.time());
                let Some(lesson_time_num) = lesson_time_num else {
                    debug!("No lesson at this time! Skipping...");
                    continue;
                };

                info!("Ready for attendance check! Current time: {:#?}", local_time);
                debug!("day_of_week: {:#?}", day_of_week);
                debug!("week_parity: {:#?}", week_parity);
                debug!("week_num: {:#?}", week_num);
                debug!("lesson_time_num: {:#?}", lesson_time_num);
                debug!("Time: {:#?}", local_time.time());

                let (user_schedule_info, subjects) =
                    models::attendance::get_current_pending_attendance_marks(&mut *con, week_num, day_of_week, lesson_time_num).await.unwrap();
                trace!("objs: {:#?}", user_schedule_info);
                for user_schedule in user_schedule_info {
                    let Some(token) = user_schedule.user_data.clone().attendance_token else {
                        error!("User {} has no attendance token!", user_schedule.user_id);
                        error!("Shutting down ATTENDANCE_WORKER_TASK...");
                        return;
                    };

                    //wait 5s
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                    let schedule = api::etu_attendance_api::get_cur_schedule(token.clone()).await;
                    if let GetScheduleResult::WrongToken = schedule {
                        warn!("Wrong token for user_id: {:?} (group_id: {:?})! Invalidating user token...",
                            user_schedule.user_data.user_id, user_schedule.user_data.group_id);
                        models::users::invalidate_attendance_token(&mut *con, user_schedule.user_id).await.unwrap();
                        continue;
                    }
                    let GetScheduleResult::Ok(schedule) = schedule else {
                        warn!("Failed to get schedule for user_id: {:?} (group_id: {:?})! Unknown response: {:?}",
                            user_schedule.user_data.user_id, user_schedule.user_data.group_id, schedule);
                        continue;
                    };

                    let current_subjects: Vec<_> = schedule.iter().filter(|x| {
                        x.checkInStart.parse::<chrono::DateTime<chrono::Utc>>().unwrap() <= local_time_utc &&
                        x.checkInDeadline.parse::<chrono::DateTime<chrono::Utc>>().unwrap() >= local_time_utc
                    }).collect();
                    debug!("current_subjects: {:#?}", current_subjects);

                    info!("User_id: {:?} (group_id: {:?}), user_schedule.attend_lessons: {:#?}", user_schedule.user_data.user_id, user_schedule.user_data.group_id, user_schedule.attend_lessons.iter().map(|(_, subject_id)| {
                        let subject = subjects.get(&subject_id).unwrap();
                        subject.title.clone()
                    }).collect::<Vec<_>>());

                    //iterate over lessons
                    for (time_link_id, subject_id) in user_schedule.attend_lessons {
                        let subject_title = subjects[&subject_id].title.clone();
                        let subject_type = subjects[&subject_id].subject_type.clone();
                        let short_title = subjects[&subject_id].short_title.clone();

                        if processed_check_ins.contains(&(user_schedule.user_id, time_link_id, week_num as i32)) {
                            debug!("Check in for user_id: {:?} (group_id: {:?}), time_link_id: {:?} already processed! Skipping...", user_schedule.user_data.user_id, user_schedule.user_data.group_id, time_link_id);
                            continue;
                        }

                        info!("finding match for subject_title: {:#?}...", subject_title);

                        let mut found_id = None;
                        for current_subject in &current_subjects {
                            if current_subject.lesson.title == subject_title && current_subject.lesson.subjectType == subject_type
                            && current_subject.lesson.shortTitle == short_title {
                                found_id = Some(current_subject.id);
                                break;
                            }
                        }
                        if let Some(id) = found_id {
                            info!("Found subject from attendance system: {:#?}", id);
                            info!("Processing check_in...");
                            let check_in_res = api::etu_attendance_api::check_in(token.clone(), id).await;
                            match check_in_res {
                                CheckInResult::Ok => {
                                    info!("Check in success!");
                                    // models::attendance::set_attendance_mark(&mut *trx, time_link_id, true).await.unwrap();
                                    processed_check_ins.insert((user_schedule.user_id, time_link_id, week_num as i32));
                                }
                                CheckInResult::WrongToken => {
                                    warn!("Wrong token for user_id: {:?} (group_id: {:?})! Invalidating user token...",
                                        user_schedule.user_data.user_id, user_schedule.user_data.group_id);
                                    models::users::invalidate_attendance_token(&mut *con, user_schedule.user_id).await.unwrap();
                                    continue;
                                }
                                other => {
                                    warn!("Check in failed: Unknown response: {:#?}", other);
                                    error!("Shutting down ATTENDANCE_WORKER_TASK...");
                                    return;
                                }
                            }
                        }
                        else {
                            warn!("Failed to find subject from attendance system!");
                        }
                    }
                }
            }
            _ = shutdown_notifier.notified() => {
                warn!("ATTENDANCE_WORKER_TASK: Shutdown notification recieved! exiting task...");
                return;
            }
        );
    }
}