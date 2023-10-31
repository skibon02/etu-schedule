use std::collections::BTreeMap;
use rocket_db_pools::Connection;
use sqlx::{Acquire, Sqlite, SqliteConnection};
use sqlx::pool::PoolConnection;
use crate::api::etu_api::{DepartmentOriginal, FacultyOriginal, GroupOriginal};
use crate::models::{Db, MergeResult};

use crate::models::groups::{DepartmentModel, FacultyModel, GroupModel};


async fn faculty_single_merge(faculty: FacultyModel, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    let id = faculty.faculty_id;
    let row : Option<FacultyModel> = sqlx::query_as("SELECT * FROM faculties WHERE faculty_id = ?")
        .bind(id)
        .fetch_optional(&mut **con)
        .await?;

    if let Some(row) = row {
        if row != faculty {
            info!("MERGE::FACULTIES \tUpdating faculty {} with title {}: \n old: {:?}, new: {:?}", id, faculty.title, row, faculty);
            sqlx::query("UPDATE faculties SET title = ? WHERE faculty_id = ?")
                .bind(&faculty.title)
                .bind(&faculty.faculty_id)
                .execute(&mut **con)
                .await?;
            return Ok(MergeResult::Updated);
        }

        return Ok(MergeResult::NotModified);
    }
    else {
        info!("MERGE::FACULTIES \tNew faculty: {} with title {}", id, faculty.title);
        sqlx::query("INSERT INTO faculties (faculty_id, title) VALUES (?, ?)")
            .bind(&faculty.faculty_id)
            .bind(&faculty.title)
            .execute(&mut **con)
            .await?;
        return Ok(MergeResult::Inserted);
    }
}
async fn department_single_merge(department: DepartmentModel, faculty: Option<&FacultyModel>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    let id = department.department_id;
    let row : Option<DepartmentModel> = sqlx::query_as("SELECT * FROM departments WHERE department_id = ?")
        .bind(id)
        .fetch_optional(&mut *con)
        .await?;

    if let Some(faculty) = faculty {
        faculty_single_merge(faculty.clone(), &mut *con).await?;
    }

    if let Some(row) = row {
        if row != department {
            info!("MERGE::DEPARTMENTS \tUpdating department {} with title {}: \n old: {:?}, new: {:?}", id, department.title, row, department);
            sqlx::query("UPDATE departments SET title = ?, long_title = ?, department_type = ?, faculty_id = ? WHERE department_id = ?")
                .bind(&department.title)
                .bind(&department.long_title)
                .bind(&department.department_type)
                .bind(&department.faculty_id)
                .bind(&department.department_id)
                .execute(&mut *con)
                .await?;
            return Ok(MergeResult::Updated);
        }

        return Ok(MergeResult::NotModified);
    }
    else {
        info!("MERGE::DEPARTMENTS \tNew department: {} with title {}", id, department.title);
        sqlx::query("INSERT INTO departments (department_id, title, long_title, department_type, faculty_id) VALUES (?, ?, ?, ?, ?)")
            .bind(&department.department_id)
            .bind(&department.title)
            .bind(&department.long_title)
            .bind(&department.department_type)
            .bind(&department.faculty_id)
            .execute(con)
            .await?;
        return Ok(MergeResult::Inserted)
    }
}

async fn group_single_merge(group: &GroupModel, department: Option<&DepartmentModel>, faculty: Option<&FacultyModel>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<MergeResult> {
    let id = group.group_id;
    let row : Option<GroupModel> = sqlx::query_as("SELECT * FROM groups WHERE group_id = ?")
        .bind(id)
        .fetch_optional(&mut *con)
        .await?;

    if Some(department) = department {
        department_single_merge(department.clone(), faculty, &mut *con).await?;
    }

    if let Some(row) = row {
        if row != *group {
            info!("MERGE::GROUPS \tUpdating group {} with number {}: \n old: {:?}, new: {:?}", id, group.number, row, *group);
            sqlx::query("UPDATE groups SET number = ?, studying_type = ?, education_level = ?, start_year = ?, end_year = ?, department_id = ?, specialty_id = ? WHERE group_id = ?")
                .bind(&group.number)
                .bind(&group.studying_type)
                .bind(&group.education_level)
                .bind(&group.start_year)
                .bind(&group.end_year)
                .bind(&group.department_id)
                .bind(&group.specialty_id)
                .bind(&group.group_id)
                .execute(&mut *con)
                .await?;
            return Ok(MergeResult::Updated);
        }
        else {
            return Ok(MergeResult::NotModified);
        }
    }
    else {
        info!("MERGE::GROUPS \tNew group: {} with number {}", id, group.number);
        sqlx::query("INSERT INTO groups (group_id, number, studying_type, education_level, start_year, end_year, department_id, specialty_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(&group.group_id)
            .bind(&group.number)
            .bind(&group.studying_type)
            .bind(&group.education_level)
            .bind(&group.start_year)
            .bind(&group.end_year)
            .bind(&group.department_id)
            .bind(&group.specialty_id)
            .execute(&mut **con)
            .await?;
        return Ok(MergeResult::Inserted);
    }
}

pub async fn groups_merge(groups: &Vec<GroupOriginal>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    let start = std::time::Instant::now();
    let mut modified = false;
    for group in groups.iter() {
        let group_model = group.as_model();
        let department_model = group.department.as_model();
        let faculty_model = group.department.faculty.as_model();
        let res = group_single_merge(group, Some(&department_model), Some(&faculty_model), con).await.unwrap();

        if let MergeResult::Updated | MergeResult::Inserted = res {
            modified = true;
        }
    }
    if modified {
        info!("MERGE::GROUPS \tGroups merge done with modifications");
    }
    else {
        info!("MERGE::GROUPS \tGroups merge done without modifications");
    }
    info!("MERGE::GROUPS \tGroups merge done in {:?}", start.elapsed());
    Ok(())
}
