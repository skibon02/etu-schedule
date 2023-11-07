use std::collections::BTreeMap;
use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::Sqlite;
use crate::data_merges::MergeResult;
use crate::models;
use crate::models::subjects::{get_subjects_cur_gen, SubjectModel};

async fn single_subject_merge(subject_id: u32, subject: &SubjectModel, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    debug!("Merging single subject {}", subject_id);
    let row : Option<SubjectModel> = sqlx::query_as("SELECT * FROM subjects WHERE subject_id = ?")
        .bind(subject_id)
        .fetch_optional(&mut **con)
        .await.context("Failed to fetch subject in subject merge")?;

    if let Some(row) = row {
        // merge
        debug!("Found existing subject");

        let mut diff = false;
        if row.title != subject.title ||
            row.short_title != subject.short_title ||
            row.subject_type != subject.subject_type ||
            row.control_type != subject.control_type {
            diff = true;
        }

        if diff {
            debug!("Detected difference in subject, updating...");

            let new_gen_id = last_gen_id + 1;
            models::subjects::create_new_gen(con, new_gen_id).await?;

            //invalidate old gen
            sqlx::query("UPDATE subjects SET gen_end = ? WHERE subject_id = ? AND gen_end IS NULL")
                .bind(&new_gen_id)
                .bind(&subject_id)
                .execute(&mut **con).await.context("Failed to invalidate old subject generation")?;

            // insert new row
            sqlx::query("INSERT INTO subjects (subject_id, \
        title, short_title, subject_type, control_type, \
        semester, alien_id, department_id,\
        gen_start, existence_diff)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(&subject_id)
                .bind(&subject.title)
                .bind(&subject.short_title)
                .bind(&subject.subject_type)
                .bind(&subject.control_type)

                .bind(&subject.semester)
                .bind(&subject.alien_id)
                .bind(&subject.department_id)
                .bind(&new_gen_id)
                .bind("changed")
                .execute(&mut **con).await.context("Failed to insert subject in subject merge")?;

            Ok(MergeResult::Updated)
        }
        else {
            debug!("No difference in subject, skipping...");
            // btw update untracked information
            if row.semester != subject.semester ||
                row.alien_id != subject.alien_id ||
                row.department_id != subject.department_id {
                debug!("Updating untracked information in subject...");

                sqlx::query("UPDATE subjects SET semester = ?, alien_id = ?, department_id = ? WHERE subject_id = ?")
                    .bind(&subject.semester)
                    .bind(&subject.alien_id)
                    .bind(&subject.department_id)
                    .bind(&subject_id)
                    .execute(&mut **con)
                    .await.context("Failed to update subject in subject merge")?;

            }
            Ok(MergeResult::NotModified)
        }
    }
    else {
        // insert
        debug!("Inserting new subject");

        let new_gen_id = last_gen_id + 1;
        models::subjects::create_new_gen(con, new_gen_id).await?;

        sqlx::query("INSERT INTO subjects (subject_id, \
        title, short_title, subject_type, control_type, \
        semester, alien_id, department_id,\
        gen_start, existence_diff)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&subject_id)
            .bind(&subject.title)
            .bind(&subject.short_title)
            .bind(&subject.subject_type)
            .bind(&subject.control_type)

            .bind(&subject.semester)
            .bind(&subject.alien_id)
            .bind(&subject.department_id)
            .bind(new_gen_id)
            .bind("new")
            .execute(&mut **con).await.context("Failed to insert subject in subject merge")?;

        Ok(MergeResult::Inserted)
    }
}

pub async fn subjects_merge(subjects: &BTreeMap<u32, SubjectModel>, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    info!("MERGE::SUBJECTS Merging subjects started!");
    let start = std::time::Instant::now();

    let mut modified = false;
    for (&subj_id, subj) in subjects {
        let res = single_subject_merge(subj_id, subj, last_gen_id, con).await?;
        if let MergeResult::Updated | MergeResult::Inserted = res {
            modified = true;
            debug!("MERGE::SUBJECTS Merging subjects modified!");
        }
    }

    if modified {
        info!("MERGE::SUBJECTS Merging subjects finished with changes! New generation created with id {}", last_gen_id + 1);
    }
    info!("MERGE::SUBJECTS Merging subjects finished in {}ms!", start.elapsed().as_millis());

    Ok(())
}