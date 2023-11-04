use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::Sqlite;
use crate::api::etu_api::ScheduleObjectOriginal;
use crate::data_merges::MergeResult;
use crate::models;
use crate::models::schedule::ScheduleObjModel;

async fn get_new_link_id(con: &mut PoolConnection<Sqlite>) -> anyhow::Result<u32> {
    let res: Option<u32> = sqlx::query_scalar("SELECT MAX(link_id) as max FROM schedule_objs")
        .fetch_optional(&mut *con).await.context("Failed to fetch max link_id")?;

    Ok(res.unwrap_or(0) + 1)
}

async fn get_last_gen_id(con: &mut PoolConnection<Sqlite>) -> anyhow::Result<u32> {
    let res: Option<u32> = sqlx::query_scalar("SELECT MAX(gen_id) as max FROM schedule_generation")
        .fetch_optional(&mut *con).await.context("Failed to fetch max gen_id")?;

    Ok(res.unwrap_or(0))
}


async fn create_new_gen(con: &mut PoolConnection<Sqlite>, gen_id: u32) -> anyhow::Result<()> {
    sqlx::query("INSERT OR IGNORE INTO schedule_generation (gen_id, creation_time) VALUES (?, strftime('%s', 'now'))")
        .bind(gen_id)
        .execute(&mut *con)
        .await.context("Failed to insert new schedule generation")?;

    Ok(())
}

/// group of schedule object with the same lesson
/// last gen id is used to reuse single new generation across merges
async fn single_schedule_obj_group_merge(group_id: u32, input_schedule_objs: &Vec<ScheduleObjModel>, subject_id: u32, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<Vec<MergeResult>> {
    debug!("Merging single schedule object group");
    let mut input_schedule_objs = input_schedule_objs.clone();

    let mut existing_sched_objs: Vec<ScheduleObjModel> = sqlx::query_as("SELECT * FROM schedule_objs WHERE group_id = ? AND subject_id = ?")
        .bind(group_id)
        .bind(subject_id)
        .fetch_all(&mut *con)
        .await.context("Failed to fetch schedule object in ")?;

    debug!("group_id: {}, subject_id: {}", group_id, subject_id);
    debug!("Found {} existing schedule objects", existing_sched_objs.len());
    debug!("Received {} input schedule objects", input_schedule_objs.len());


    let mut res = Vec::new();

    //try to link by schedule_obj_id or get_lesson_pos
    for input_sched_obj in &input_schedule_objs {
        debug!("Searching link for input schedule object: {}", input_sched_obj.last_known_orig_sched_obj_id);
        let mut found = false;
        for existing_sched_obj in &mut existing_sched_objs {
            if input_sched_obj.get_lesson_pos() == existing_sched_obj.get_lesson_pos() {

                if input_sched_obj.last_known_orig_sched_obj_id == existing_sched_obj.last_known_orig_sched_obj_id {
                    debug!("Linked by last_known_orig_sched_obj_id");
                }
                else {
                    debug!("Linked by get_lesson_pos() information");
                }
                found = true;

                // process diff and update
                let mut diff = false;

                if input_sched_obj.teacher_id != existing_sched_obj.teacher_id
                    || input_sched_obj.second_teacher_id != existing_sched_obj.second_teacher_id
                    || input_sched_obj.auditorium != existing_sched_obj.auditorium
                    || input_sched_obj.get_lesson_pos() != existing_sched_obj.get_lesson_pos() {
                    diff = true;
                }


                if diff {
                    debug!("Detected diff in schedule object, updating...");
                    todo!("Update schedule object");
                    res.push(MergeResult::Updated);
                }
                else {
                    debug!("No diff in schedule object, skipping...");
                    // btw update untracked information
                    if input_sched_obj.updated_at != existing_sched_obj.updated_at
                        || input_sched_obj.last_known_orig_sched_obj_id != existing_sched_obj.last_known_orig_sched_obj_id {
                        info!("Updating untracked information for schedule object");

                        sqlx::query("UPDATE schedule_objs SET \
                    updated_at = ?, \
                    last_known_orig_sched_obj_id = ? \
                    WHERE schedule_obj_id = ?")
                            .bind(input_sched_obj.updated_at.clone())
                            .bind(input_sched_obj.last_known_orig_sched_obj_id)
                            .bind(existing_sched_obj.schedule_obj_id)
                            .execute(&mut *con)
                            .await.context("Failed to update schedule object")?;
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

            create_new_gen(con, new_gen_id).await?;

            sqlx::query("INSERT INTO schedule_objs \
            (last_known_orig_sched_obj_id, group_id, link_id, subject_id, subject_gen_id,\
            teacher_id, teacher_gen_id, second_teacher_id, second_teacher_gen_id, auditorium,\
            updated_at, time, week_day, week_parity, gen_start, existence_diff) \
            VALUES\
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(input_sched_obj.last_known_orig_sched_obj_id)
                .bind(group_id)
                .bind(new_link_id)
                .bind(subject_id)
                .bind(models::schedule::get_subject_cur_gen(con, subject_id).await.unwrap())
                .bind(input_sched_obj.teacher_id)
                .bind(0)
                .bind(input_sched_obj.second_teacher_id)
                .bind(0)
                .bind(input_sched_obj.auditorium.clone())
                .bind(input_sched_obj.updated_at.clone())
                .bind(input_sched_obj.time)
                .bind(input_sched_obj.week_day)
                .bind(input_sched_obj.week_parity)
                .bind(new_gen_id)
                .bind("new")
                .execute(&mut *con)
                .await.context("Failed to insert new schedule object")?;


            res.push(MergeResult::Inserted);
        }
    }

    for existing_sched_obj in existing_sched_objs {
        let mut found = false;
        for input_sched_obj in &mut input_schedule_objs {
            if input_sched_obj.last_known_orig_sched_obj_id == existing_sched_obj.last_known_orig_sched_obj_id
            || input_sched_obj.get_lesson_pos() == existing_sched_obj.get_lesson_pos() {
                found = true;
                break;
            }
        }
        if !found {
            // invalidate old sched_obj (update gen_id)
            debug!("Invalidating old schedule object: {}", existing_sched_obj.last_known_orig_sched_obj_id);

            let new_gen_id = last_gen_id + 1;
            create_new_gen(con, new_gen_id).await?;

            sqlx::query!("UPDATE schedule_objs SET \
            gen_end = ? \
            WHERE schedule_obj_id = ?", new_gen_id, existing_sched_obj.schedule_obj_id)
                .execute(&mut *con)
                .await.context("Failed to invalidate old schedule object")?;
        }
    }


    Ok(res)
}

pub async fn schedule_objs_merge(group_id: u32, schedule_objs: &Vec<ScheduleObjModel>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    // group by subject_id
    info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for group id {} started!", group_id);
    let start = std::time::Instant::now();
    let mut subj_id_to_sched_objs: std::collections::HashMap<u32, Vec<ScheduleObjModel>> = std::collections::HashMap::new();
    for sched_obj in schedule_objs {
        if !subj_id_to_sched_objs.contains_key(&sched_obj.subject_id) {
            subj_id_to_sched_objs.insert(sched_obj.subject_id, Vec::new());
        }
        subj_id_to_sched_objs.get_mut(&sched_obj.subject_id).unwrap().push(sched_obj.clone());
    }

    let last_gen_id = get_last_gen_id(con).await?;


    let mut any_modified = false;
    for (subj_id, subj_sched_objs) in subj_id_to_sched_objs {
        let mut modified = false;
        info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for subject id {} started!", subj_id);
        let res = single_schedule_obj_group_merge(group_id, &subj_sched_objs, subj_id, last_gen_id, con).await?;
        for r in res {
            if r != MergeResult::NotModified {
                modified = true;
                info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for subject id {} modified!", subj_id);
                break;
            }
        }

        if modified {
            info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for subject id {} finished:\tmodified!", subj_id);
            any_modified = true;
        }
        else {

            info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for subject id {} finished:\tno changes!", subj_id);
        }
    }

    if any_modified {
        info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for group id {} finished with changes! New generation created with id {}", group_id, last_gen_id + 1);
    }
    else {
        info!("MERGE::SCHEDULE_OBJ_GROUP Merging schedule objects for group id {} finished with no changes! Keeping last generation", group_id);
    }
    info!("MERGE::SCHEDULE_OBJ_GROUP Merging sched obj group took {:?}", start.elapsed());

    Ok(())
}