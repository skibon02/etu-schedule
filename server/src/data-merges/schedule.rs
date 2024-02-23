use crate::data_merges::MergeResult;
use crate::models;
use crate::models::schedule::{
    get_cur_schedule_for_group_with_subject, ScheduleObjModel, ScheduleObjModelNormalized, WeekDay,
};
use anyhow::Context;
use sqlx::PgConnection;
use std::collections::{BTreeMap, BTreeSet};

async fn get_new_link_id(con: &mut PgConnection) -> anyhow::Result<i32> {
    let res: Option<i32> =
        sqlx::query_scalar!("SELECT MAX(time_link_id) as max FROM schedule_objs")
            .fetch_one(&mut *con)
            .await
            .context("Failed to fetch max time_link_id")?;

    Ok(res.unwrap_or(0) + 1)
}

async fn get_last_gen_id(con: &mut PgConnection, group_id: i32) -> anyhow::Result<i32> {
    let res: Option<i32> = sqlx::query_scalar!(
        "SELECT MAX(gen_id) as max FROM schedule_generation \
        WHERE group_id = $1",
        group_id
    )
    .fetch_one(&mut *con)
    .await
    .context("Failed to fetch max gen_id")?;

    Ok(res.unwrap_or(0))
}

async fn create_new_gen(con: &mut PgConnection, gen_id: i32, group_id: i32) -> anyhow::Result<()> {
    sqlx::query!("INSERT INTO schedule_generation (gen_id, creation_time, group_id) VALUES ($1, NOW(), $2) ON CONFLICT DO NOTHING",
        gen_id, group_id)
        .execute(&mut *con)
        .await.context("Failed to insert new schedule generation")?;

    Ok(())
}

/// group of schedule object with the same lesson
/// last gen id is used to reuse single new generation across merges
async fn single_schedule_obj_group_merge(
    group_id: i32,
    input_schedule_objs: &Vec<ScheduleObjModelNormalized>,
    subject_id: i32,
    last_gen_id: i32,
    con: &mut PgConnection,
) -> anyhow::Result<Vec<MergeResult>> {
    trace!("Merging single schedule object group");
    let mut input_schedule_objs = input_schedule_objs.clone();

    //check for unique position condition
    let mut unique_positions = BTreeMap::<(WeekDay, String, i32), i32>::new();
    for input_sched_obj in &input_schedule_objs {
        let sched_obj = &input_sched_obj.schedule_object;
        *unique_positions
            .entry((
                sched_obj.week_day,
                sched_obj.week_parity.clone(),
                sched_obj.time,
            ))
            .or_default() += 1;
    }

    for unique_position in unique_positions {
        if unique_position.1 > 1 {
            return Err(anyhow::anyhow!(
                "Unique position condition in single_schedule_obj_group_merge has failed!"
            ));
        }
    }

    let mut existing_sched_objs =
        get_cur_schedule_for_group_with_subject(con, group_id, subject_id).await?;

    trace!("group_id: {}, subject_id: {}", group_id, subject_id);
    trace!(
        "Found {} existing schedule objects",
        existing_sched_objs.len()
    );
    trace!(
        "Received {} input schedule objects",
        input_schedule_objs.len()
    );

    let mut res = Vec::new();

    let latest_subject_gen = models::subjects::get_subjects_cur_gen(con).await?;
    let latest_teachers_gen = models::teachers::get_teachers_cur_gen(con).await?;

    //try to link by schedule_obj_id or get_lesson_pos
    for ScheduleObjModelNormalized {
        schedule_object: input_sched_obj,
        teachers: input_sched_obj_teachers,
    } in &input_schedule_objs
    {
        let input_schedule_obj_teachers: BTreeSet<_> = input_sched_obj_teachers.iter().collect();
        let input_schedule_obj_auditoriums: BTreeSet<_> = input_sched_obj
            .auditorium
            .clone()
            .map(|a| a.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default();
        trace!(
            "Searching link for input schedule object: {}",
            input_sched_obj.last_known_orig_sched_obj_id
        );
        let mut found = false;
        for ScheduleObjModelNormalized {
            schedule_object: existing_sched_obj,
            teachers: existing_sched_obj_teachers,
        } in &mut existing_sched_objs
        {
            let existing_sched_obj_teachers: BTreeSet<_> =
                existing_sched_obj_teachers.iter().collect();
            let existing_sched_obj_auditoriums: BTreeSet<_> = existing_sched_obj
                .auditorium
                .clone()
                .map(|a| a.split(',').map(|s| s.trim().to_string()).collect())
                .unwrap_or_default();
            if input_sched_obj.get_lesson_pos() == existing_sched_obj.get_lesson_pos() {
                found = true;

                // process diff and update
                let mut diff = false;

                if input_schedule_obj_teachers != existing_sched_obj_teachers
                    || input_schedule_obj_auditoriums != existing_sched_obj_auditoriums
                    || input_sched_obj.get_lesson_pos() != existing_sched_obj.get_lesson_pos()
                {
                    diff = true;
                }

                if diff {
                    // update
                    debug!("Detected diff in schedule object, updating...");

                    // invalidate old sched_obj (update gen_id)

                    let new_gen_id = last_gen_id + 1;
                    create_new_gen(con, new_gen_id, group_id).await?;

                    sqlx::query!(
                        "UPDATE schedule_objs SET \
                        gen_end = $1 \
                        WHERE schedule_obj_id = $2 AND gen_end IS NULL",
                        new_gen_id,
                        existing_sched_obj.schedule_obj_id
                    )
                    .execute(&mut *con)
                    .await
                    .context("Failed to invalidate old schedule object")?;

                    // insert new object
                    let schedule_obj_id: i32 = sqlx::query_scalar!(
                        "INSERT INTO schedule_objs \
            (last_known_orig_sched_obj_id, group_id, time_link_id, subject_id, subject_gen_id,\
            teacher_gen_id, auditorium,\
            time, week_day, week_parity, gen_start, existence_diff) \
            VALUES\
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, \
            $11, $12) RETURNING schedule_obj_id",
                        input_sched_obj.last_known_orig_sched_obj_id,
                        group_id,
                        existing_sched_obj.time_link_id,
                        subject_id,
                        latest_subject_gen,
                        latest_teachers_gen,
                        input_sched_obj.auditorium.clone(),
                        input_sched_obj.time,
                        input_sched_obj.week_day as WeekDay,
                        input_sched_obj.week_parity.clone(),
                        new_gen_id,
                        "changed"
                    )
                    .fetch_one(&mut *con)
                    .await
                    .context("Failed to insert new schedule object")?;

                    // insert new teachers
                    for teacher_id in input_sched_obj_teachers {
                        sqlx::query!(
                            "INSERT INTO schedule_objs_teachers (schedule_obj_id, teacher_id) VALUES ($1, $2)",
                            schedule_obj_id,
                            teacher_id
                        )
                        .execute(&mut *con)
                        .await
                        .context("Failed to insert new schedule object teachers")?;
                    }

                    info!(
                        "Schedule object [CHANGED]: ({}): {} week {}:{}",
                        input_sched_obj.last_known_orig_sched_obj_id,
                        input_sched_obj.week_parity,
                        input_sched_obj.week_day.to_string(),
                        input_sched_obj.time
                    );

                    res.push(MergeResult::Updated);
                } else {
                    trace!("No diff in schedule object, skipping...");
                    // btw update untracked information
                    if input_sched_obj.last_known_orig_sched_obj_id
                        != existing_sched_obj.last_known_orig_sched_obj_id
                        || existing_sched_obj.subject_gen_id != latest_subject_gen
                        || existing_sched_obj
                            .teacher_gen_id
                            .map(|id| id != latest_teachers_gen)
                            .unwrap_or(false)
                    {
                        debug!("Updating untracked information for schedule object");

                        let new_teacher_gen_id = existing_sched_obj
                            .teacher_gen_id
                            .map(|_| latest_teachers_gen);
                        sqlx::query!(
                            "UPDATE schedule_objs SET \
                            last_known_orig_sched_obj_id = $1, \
                            subject_gen_id = $2, \
                            teacher_gen_id = $3 \
                            WHERE schedule_obj_id = $4",
                            input_sched_obj.last_known_orig_sched_obj_id,
                            latest_subject_gen,
                            new_teacher_gen_id,
                            existing_sched_obj.schedule_obj_id
                        )
                        .execute(&mut *con)
                        .await
                        .context("Failed to update schedule object")?;
                    }
                    res.push(MergeResult::NotModified);
                }

                break;
            }
        }
        if !found {
            debug!("Schedule object not found, inserting...");
            //process new schedule object
            let new_link_id = get_new_link_id(con).await?;
            let new_gen_id = last_gen_id + 1;

            create_new_gen(con, new_gen_id, group_id).await?;

            let schedule_obj_id: i32 = sqlx::query_scalar!(
                "INSERT INTO schedule_objs \
            (last_known_orig_sched_obj_id, group_id, time_link_id, subject_id, subject_gen_id,\
            teacher_gen_id, auditorium,\
            time, week_day, week_parity, gen_start, existence_diff) \
            VALUES\
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, \
            $11, $12) RETURNING schedule_obj_id",
                input_sched_obj.last_known_orig_sched_obj_id,
                group_id,
                new_link_id,
                subject_id,
                latest_subject_gen,
                latest_teachers_gen,
                input_sched_obj.auditorium.clone(),
                input_sched_obj.time,
                input_sched_obj.week_day as WeekDay,
                input_sched_obj.week_parity.clone(),
                new_gen_id,
                "new"
            )
            .fetch_one(&mut *con)
            .await
            .context("Failed to insert new schedule object")?;
            info!(
                "Schedule object [INSERTED]: ({}): {} week {}:{}",
                input_sched_obj.last_known_orig_sched_obj_id,
                input_sched_obj.week_parity,
                input_sched_obj.week_day.to_string(),
                input_sched_obj.time
            );

            // insert new teachers
            for teacher_id in input_sched_obj_teachers {
                sqlx::query!(
                    "INSERT INTO schedule_objs_teachers (schedule_obj_id, teacher_id) VALUES ($1, $2)",
                    schedule_obj_id,
                    teacher_id
                )
                .execute(&mut *con)
                .await
                .context("Failed to insert new schedule object teachers")?;
            }

            res.push(MergeResult::Inserted);
        }
    }

    for existing_sched_obj in existing_sched_objs {
        let mut found = false;
        for input_sched_obj in &mut input_schedule_objs {
            if input_sched_obj.schedule_object.get_lesson_pos()
                == existing_sched_obj.schedule_object.get_lesson_pos()
            {
                found = true;
                break;
            }
        }
        if !found {
            // invalidate old sched_obj (update gen_id)
            info!(
                "Invalidating old schedule object: {}",
                existing_sched_obj
                    .schedule_object
                    .last_known_orig_sched_obj_id
            );

            let new_gen_id = last_gen_id + 1;
            create_new_gen(con, new_gen_id, group_id).await?;

            sqlx::query!(
                "UPDATE schedule_objs SET \
            gen_end = $1 \
            WHERE schedule_obj_id = $2 AND gen_end IS NULL",
                new_gen_id,
                existing_sched_obj.schedule_object.schedule_obj_id
            )
            .execute(&mut *con)
            .await
            .context("Failed to invalidate old schedule object")?;

            res.push(MergeResult::Removed);
        }
    }

    Ok(res)
}

pub async fn schedule_objs_merge(
    group_id: i32,
    schedule_objs: &Vec<ScheduleObjModelNormalized>,
    con: &mut PgConnection,
) -> anyhow::Result<()> {
    let group_name = models::groups::get_group(con, group_id)
        .await?
        .map(|r| r.number);
    if group_name.is_none() {
        return Err(anyhow::anyhow!("Group with id {} not found!", group_id));
    }
    let group_name = group_name.unwrap();
    info!(
        "MERGE::SCHEDULE_OBJ_GROUP Merging started! Group: ({}): {}",
        group_id, group_name
    );
    let start = std::time::Instant::now();
    let mut subj_id_to_sched_objs: std::collections::HashMap<i32, Vec<ScheduleObjModelNormalized>> =
        std::collections::HashMap::new();

    // group by subject id
    for sched_obj in schedule_objs {
        subj_id_to_sched_objs
            .entry(sched_obj.schedule_object.subject_id)
            .or_default()
            .push(sched_obj.clone());
    }
    let new_subject_ids: Vec<i32> = subj_id_to_sched_objs.keys().cloned().collect();

    let last_gen_id = get_last_gen_id(con, group_id).await?;
    info!("MERGE::SCHEDULE_OBJ_GROUP Last generation: {}", last_gen_id);

    let mut modified = false;
    let mut total_inserted_cnt = 0;
    let mut total_changed_cnt = 0;
    let mut total_removed_cnt = 0;
    for (subj_id, subj_sched_objs) in subj_id_to_sched_objs {
        let mut inserted_cnt = 0;
        let mut changed_cnt = 0;
        let mut removed_cnt = 0;

        trace!(
            "MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for subject id {} started!",
            subj_id
        );
        let res =
            single_schedule_obj_group_merge(group_id, &subj_sched_objs, subj_id, last_gen_id, con)
                .await?;
        for r in res {
            if r == MergeResult::Inserted {
                inserted_cnt += 1;
            }
            if r == MergeResult::Updated {
                changed_cnt += 1;
            }
            if r == MergeResult::Removed {
                removed_cnt += 1;
            }
            if r != MergeResult::NotModified {
                modified = true;
            }
        }

        total_inserted_cnt += inserted_cnt;
        total_changed_cnt += changed_cnt;
        total_removed_cnt += removed_cnt;

        if inserted_cnt > 0 || changed_cnt > 0 || removed_cnt > 0 {
            info!(
                "MERGE::SCHEDULE_OBJ_GROUP Schedule objects modified! Grouped by subject_id = {}",
                subj_id
            );
            info!("\tinserted: {}", inserted_cnt);
            info!("\tchanged: {}", changed_cnt);
            info!("\tremoved: {}", removed_cnt);

            info!(
                "MERGE::SCHEDULE_OBJ_GROUP Using generation id {}",
                last_gen_id + 1
            );
        }
    }

    // phase 2. invalidate removed subjects
    let active_subjects = models::schedule::get_cur_subjects_for_group(con, group_id)
        .await
        .context("Failed to fetch existing schedule objects")?;
    for active_subject in active_subjects {
        if !new_subject_ids.contains(&active_subject.subject_id) {
            info!(
                "MERGE::SCHEDULE_OBJ_GROUP Invalidating removed subject: {}",
                active_subject.subject_id
            );
            let new_gen_id = last_gen_id + 1;
            create_new_gen(con, new_gen_id, group_id).await?;

            sqlx::query!(
                "UPDATE schedule_objs SET \
            gen_end = $1 \
            WHERE group_id = $2 AND subject_id = $3 AND gen_end IS NULL",
                new_gen_id,
                group_id,
                active_subject.subject_id
            )
            .execute(&mut *con)
            .await
            .context("Failed to invalidate removed subject")?;
            modified = true;

            total_removed_cnt += 1;
        }
    }

    // finalize
    models::groups::set_last_group_schedule_merge(group_id, con).await?;

    if modified {
        info!("MERGE::SCHEDULE_OBJ_GROUP Merge schedule objects for group finished with changes! New generation created with id {}", last_gen_id + 1);
        info!("\tinserted: {}", total_inserted_cnt);
        info!("\tchanged: {}", total_changed_cnt);
        info!("\tremoved: {}", total_removed_cnt);
    } else {
        info!("MERGE::SCHEDULE_OBJ_GROUP Merge schedule objects: \tno changes!")
    }
    info!(
        "MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for group finished in {:?}",
        start.elapsed()
    );
    info!("");

    Ok(())
}
