use std::collections::BTreeMap;
use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, Sqlite};
use crate::data_merges::MergeResult;
use crate::models;
use crate::models::subjects::{get_subjects_cur_gen, SubjectModel};

async fn single_subject_merge(subject_id: u32, subject: &SubjectModel, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    trace!("Merging single subject {}", subject_id);
    let mut transaction = con.begin().await?;
    let row : Option<SubjectModel> = models::subjects::get_cur_gen_subject_by_id(subject_id, &mut transaction).await?;

    if let Some(row) = row {
        // merge
        trace!("Found existing subject");

        let mut diff = false;
        if row.title != subject.title ||
            row.short_title != subject.short_title ||
            row.subject_type != subject.subject_type ||
            row.control_type != subject.control_type {
            diff = true;
        }

        if diff {
            trace!("Detected difference in subject, updating...");

            let new_gen_id = last_gen_id + 1;
            models::subjects::create_new_gen(&mut transaction, new_gen_id).await?;

            //invalidate old gen
            sqlx::query("UPDATE subjects SET gen_end = ? WHERE subject_id = ? AND gen_end IS NULL")
                .bind(&new_gen_id)
                .bind(&subject_id)
                .execute(&mut transaction).await.context("Failed to invalidate old subject generation")?;

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
                .execute(&mut transaction).await.context("Failed to insert subject in subject merge")?;
            info!("Subject [CHANGED]: ({}): {}", subject_id, subject.title);

            transaction.commit().await.context("single_subject_merge transaction failed on branch 'Update'")?;
            Ok(MergeResult::Updated)
        }
        else {
            trace!("No difference in subject, skipping...");
            // btw update untracked information
            if row.semester != subject.semester ||
                row.alien_id != subject.alien_id ||
                row.department_id != subject.department_id {
                trace!("Updating untracked information in subject...");

                sqlx::query("UPDATE subjects SET semester = ?, alien_id = ?, department_id = ? WHERE subject_id = ?")
                    .bind(&subject.semester)
                    .bind(&subject.alien_id)
                    .bind(&subject.department_id)
                    .bind(&subject_id)
                    .execute(&mut transaction)
                    .await.context("Failed to update subject in subject merge")?;

            }

            transaction.commit().await.context("single_subject_merge transaction failed on branch 'NotModified'")?;
            Ok(MergeResult::NotModified)
        }
    }
    else {
        // insert
        trace!("Inserting new subject");

        let new_gen_id = last_gen_id + 1;
        models::subjects::create_new_gen(&mut transaction, new_gen_id).await?;

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
            .execute(&mut transaction).await.context("Failed to insert subject in subject merge")?;
        info!("Subject [INSERTED]: ({}): {}", subject_id, subject.title);

        transaction.commit().await.context("single_subject_merge transaction failed on branch 'Inserted'")?;
        Ok(MergeResult::Inserted)
    }
}

pub async fn subjects_merge(subjects: &BTreeMap<u32, Vec<SubjectModel>>, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    info!("MERGE::SUBJECTS Merging subjects started! Last generation: {}", last_gen_id);
    let start = std::time::Instant::now();

    let mut changed_cnt = 0;
    let mut inserted_cnt = 0;
    for (&subj_id, subjects) in subjects {
        for s in subjects.iter().skip(1) {
            if *s != subjects[0] {
                error!("Subjects with same ID are not the same! first: {:?}, second: {:?}", subjects[0], s);
                anyhow::bail!("Cannot merge subjects! Subjects with same ID are not the same!")
            }
        }
        let res = single_subject_merge(subj_id, &subjects[0], last_gen_id, con).await?;

        if MergeResult::Updated == res {
            changed_cnt += 1;
        }
        if MergeResult::Inserted == res {
            inserted_cnt += 1;
        }
    }

    if changed_cnt > 0 || inserted_cnt > 0 {
        info!("MERGE::SUBJECTS Merging subjects finished with changes! New generation created with id {}", last_gen_id + 1);
        info!("\tinserted: {}", inserted_cnt);
        info!("\tchanged: {}", changed_cnt);
    }
    else {
        info!("MERGE::SUBJECTS Merging subjects: \tno changes")
    }
    info!("MERGE::SUBJECTS Merging subjects finished in {:?}!", start.elapsed());
    info!("");

    Ok(())
}