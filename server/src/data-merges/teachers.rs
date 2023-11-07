use std::collections::BTreeMap;
use anyhow::Context;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, Sqlite};
use crate::data_merges::MergeResult;
use crate::models;
use crate::models::teachers::{get_teachers_cur_gen, TeacherModel};

async fn insert_teacher_work_departments(teacher_id: u32, work_departments: Vec<String>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    let mut transaction = con.begin().await?;
    //delete old departments
    sqlx::query("DELETE from teachers_departments WHERE teacher_id = ?")
        .bind(teacher_id)
        .execute(&mut *transaction).await.context("Deletion old teacher work_departments failed!")?;


    for department in work_departments {
        sqlx::query("INSERT INTO teachers_departments (department, teacher_id) VALUES (?, ?)")
            .bind(&department)
            .bind(teacher_id)
            .execute(&mut *transaction)
            .await?;
    }

    transaction.commit().await.context("insert_teacher_work_departments transaction failed")?;
    Ok(())
}

async fn single_teacher_merge(teacher_id: u32, teacher: &TeacherModel, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    trace!("Merging single teacher {}", teacher_id);
    let mut transaction = con.begin().await?;
    let row : Option<TeacherModel> = sqlx::query_as("SELECT * FROM teachers WHERE teacher_id = ? AND gen_end IS NULL")
        .bind(teacher_id)
        .fetch_optional(&mut transaction)
        .await.context("Failed to fetch teacher in teacher merge")?;

    if let Some(row) = row {
        // merge
        trace!("Found existing teacher");

        let mut diff = false;
        if teacher.initials != teacher.initials ||
            row.name != teacher.name ||
            row.surname != teacher.surname ||
            row.midname != teacher.midname ||
            row.birthday != teacher.birthday ||
            row.email != teacher.email ||
            row.group_id != teacher.group_id ||
            row.is_worker != teacher.is_worker ||
            row.is_department_dispatcher != teacher.is_department_dispatcher ||
            row.is_department_head != teacher.is_department_head ||
            row.is_student != teacher.is_student ||
            row.position != teacher.position ||
            row.degree != teacher.degree ||
            row.rank != teacher.rank {

            diff = true;
        }

        if diff {
            trace!("Detected difference in teacher, updating...");

            let new_gen_id = last_gen_id + 1;
            models::teachers::create_new_gen(&mut transaction, new_gen_id).await?;

            //invalidate old gen
            sqlx::query("UPDATE teachers SET gen_end = ? WHERE teacher_id = ? AND gen_end IS NULL")
                .bind(&new_gen_id)
                .bind(&teacher_id)
                .execute(&mut transaction).await.context("Failed to invalidate old teacher generation")?;

            // insert new row
            sqlx::query("INSERT INTO teachers (teacher_id, \
        initials, name, surname, midname, birthday, email, group_id,\
        is_worker, is_department_head, is_department_dispatcher,
        is_student, position, degree, rank,
        gen_start, existence_diff)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(&teacher_id)

                .bind(&teacher.initials)
                .bind(&teacher.name)
                .bind(&teacher.surname)
                .bind(&teacher.midname)
                .bind(&teacher.birthday)
                .bind(&teacher.email)
                .bind(&teacher.group_id)
                .bind(&teacher.is_worker)
                .bind(&teacher.is_department_head)
                .bind(&teacher.is_department_dispatcher)
                .bind(&teacher.is_student)
                .bind(&teacher.position)
                .bind(&teacher.degree)
                .bind(&teacher.rank)

                .bind(&new_gen_id)
                .bind("changed")
                .execute(&mut transaction).await.context("Failed to insert teacher in teacher merge")?;
            info!("Teacher [CHANGED]: {}, {}", teacher_id, teacher.initials);

            transaction.commit().await.context("single_teacher_merge transaction failed on branch 'Updated'")?;
            Ok(MergeResult::Updated)
        }
        else {
            trace!("No difference in teacher, skipping...");
            // btw update untracked information

            transaction.commit().await.context("single_teacher_merge transaction failed on branch 'NotModified'")?;
            Ok(MergeResult::NotModified)
        }
    }
    else {
        // insert
        trace!("Inserting new teacher");

        let new_gen_id = last_gen_id + 1;
        models::teachers::create_new_gen(&mut transaction, new_gen_id).await?;


        sqlx::query("INSERT INTO teachers (teacher_id, \
        initials, name, surname, midname, birthday, email, group_id,\
        is_worker, is_department_head, is_department_dispatcher,
        is_student, position, degree, rank,
        gen_start, existence_diff)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&teacher_id)

            .bind(&teacher.initials)
            .bind(&teacher.name)
            .bind(&teacher.surname)
            .bind(&teacher.midname)
            .bind(&teacher.birthday)
            .bind(&teacher.email)
            .bind(&teacher.group_id)
            .bind(&teacher.is_worker)
            .bind(&teacher.is_department_head)
            .bind(&teacher.is_department_dispatcher)
            .bind(&teacher.is_student)
            .bind(&teacher.position)
            .bind(&teacher.degree)
            .bind(&teacher.rank)

            .bind(&new_gen_id)
            .bind("new")
            .execute(&mut transaction).await.context("Failed to insert teacher in teacher merge")?;
        info!("Teacher [INSERTED]: ({}): {}", teacher_id, teacher.initials);

        transaction.commit().await.context("single_teacher_merge transaction failed on branch 'Inserted'")?;
        Ok(MergeResult::Inserted)
    }
}

pub async fn teachers_merge(teachers: BTreeMap<u32, (TeacherModel, Vec<String>)>, last_gen_id: u32, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    info!("MERGE::TEACHERS Merging started! Last generation: {}", last_gen_id);
    let start = std::time::Instant::now();

    let mut changed_cnt = 0;
    let mut inserted_cnt = 0;
    for (teacher_id, (teacher, work_departments)) in teachers {
        trace!("MERGE::TEACHERS Merging for teacher ({}): {}", teacher_id, teacher.initials);
        let res = single_teacher_merge(teacher_id, &teacher, last_gen_id, con).await?;

        // work departments are not tracked
        insert_teacher_work_departments(teacher_id, work_departments, con).await?;

        if MergeResult::Updated == res {
            changed_cnt += 1;
        }
        if MergeResult::Inserted == res {
            inserted_cnt += 1;
        }
    }

    if changed_cnt > 0 || inserted_cnt > 0 {
        info!("MERGE::TEACHERS Merging teachers finished with changes! New generation created with id {}", last_gen_id + 1);
        info!("MERGE::TEACHERS \tinserted: {}", inserted_cnt);
        info!("MERGE::TEACHERS \tchanged: {}", changed_cnt);
    }
    else {
        info!("MERGE::TEACHRS Merging teachers: \tno changes")
    }
    info!("MERGE::TEACHERS Merging teachers finished in {:?}!", start.elapsed());
    info!("");

    Ok(())
}