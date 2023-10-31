use std::collections::BTreeMap;
use rocket_db_pools::Connection;
use sqlx::{Acquire, Sqlite, SqliteConnection};
use sqlx::pool::PoolConnection;
use crate::api::etu_api::{DepartmentOriginal, FacultyOriginal};
use crate::models::Db;

use crate::models::groups::{DepartmentModel, FacultyModel, GroupsModel};


pub async fn process_merge_faculty(faculty: FacultyOriginal, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    let mut modified = false;
    let id = faculty.id;
    let row : Option<FacultyModel> = sqlx::query_as("SELECT * FROM faculties WHERE faculty_id = ?")
        .bind(id)
        .fetch_optional(&mut **con)
        .await?;

    let faculty = FacultyModel {
        faculty_id: faculty.id,
        title: faculty.title,
    };

    if let Some(row) = row {
        if row != faculty {
            info!("MERGE::FACULTIES \tUpdating faculty {} with title {}: \n old: {:?}, new: {:?}", id, faculty.title, row, faculty);
            sqlx::query("UPDATE faculties SET title = ? WHERE faculty_id = ?")
                .bind(&faculty.title)
                .bind(&faculty.faculty_id)
                .execute(&mut **con)
                .await?;
            modified = true;
        }
    }
    else {
        info!("MERGE::FACULTIES \tNew faculty: {} with title {}", id, faculty.title);
        sqlx::query("INSERT INTO faculties (faculty_id, title) VALUES (?, ?)")
            .bind(&faculty.faculty_id)
            .bind(&faculty.title)
            .execute(&mut **con)
            .await?;
        modified = true;
    }
    if modified {
        info!("MERGE::FACULTIES \tFaculties merge done with modifications");
    }
    else {
        info!("MERGE::FACULTIES \tFaculties merge done without modifications");
    }
    Ok(())
}
pub async fn process_merge_department(department: DepartmentOriginal, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {
    let mut modified = false;
    let id = department.id;
    let row : Option<DepartmentModel> = sqlx::query_as("SELECT * FROM departments WHERE department_id = ?")
        .bind(id)
        .fetch_optional(&mut *con)
        .await?;

    process_merge_faculty(department.faculty.clone(), &mut *con).await?;
    let department = DepartmentModel {
        department_id: department.id,
        title: department.title,
        long_title: department.longTitle,
        department_type: department._type,
        faculty_id: department.faculty.id,
    };

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
            modified = true;
        }
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
        modified = true;
    }
    if modified {
        info!("MERGE::DEPARTMENTS \tDepartments merge done with modifications");
    }
    else {
        info!("MERGE::DEPARTMENTS \tDepartments merge done without modifications");
    }
    Ok(())
}

pub async fn process_merge(groups: &BTreeMap<u32, (GroupsModel, DepartmentOriginal)>, con: &mut PoolConnection<Sqlite>) -> anyhow::Result<()> {

    let start = std::time::Instant::now();
    let mut modified = false;
    for (_, (group, department)) in groups.iter() {
        let id = group.group_id;
        let row : Option<GroupsModel> = sqlx::query_as("SELECT * FROM groups WHERE group_id = ?")
            .bind(id)
            .fetch_optional(&mut *con)
            .await?;

        process_merge_department(department.clone(), &mut *con).await?;

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
                modified = true;
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
