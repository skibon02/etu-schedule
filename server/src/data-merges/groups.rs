use anyhow::{anyhow, Context};
use sqlx::PgConnection;

use crate::api::etu_api::GroupOriginal;
use crate::data_merges::MergeResult;

use crate::models::groups::{DepartmentModel, FacultyModel, GroupModel};

async fn faculty_single_merge(
    faculty: FacultyModel,
    con: &mut PgConnection,
) -> anyhow::Result<MergeResult> {
    let id = faculty.faculty_id;
    let row: Option<FacultyModel> = sqlx::query_as!(
        FacultyModel,
        "SELECT * FROM faculties WHERE faculty_id = $1",
        id
    )
    .fetch_optional(&mut *con)
    .await
    .context("Failed to fetch faculty in faculty merge")?;

    if let Some(row) = row {
        if row != faculty {
            trace!(
                "MERGE::FACULTIES \tUpdating faculty {} with title {}: \n old: {:?}, new: {:?}",
                id,
                faculty.title,
                row,
                faculty
            );
            sqlx::query!(
                "UPDATE faculties SET title = $1 WHERE faculty_id = $2",
                faculty.title,
                faculty.faculty_id
            )
            .execute(&mut *con)
            .await
            .context("Failed to update faculty in faculty merge")?;
            info!(
                "Faculty [CHANGED]: ({}): {}",
                faculty.faculty_id, faculty.title
            );

            Ok(MergeResult::Updated)
        } else {
            Ok(MergeResult::NotModified)
        }
    } else {
        trace!(
            "MERGE::FACULTIES \tNew faculty: {} with title {}",
            id,
            faculty.title
        );
        sqlx::query!("INSERT INTO faculties (faculty_id, title) VALUES ($1, $2) ON CONFLICT(faculty_id) DO UPDATE
            SET title = $2",
            faculty.faculty_id, faculty.title)
            .execute(&mut *con)
            .await.context("Failed to insert faculty in faculty merge")?;
        info!(
            "Faculty [INSERTED]: ({}): {}",
            faculty.faculty_id, faculty.title
        );

        Ok(MergeResult::Inserted)
    }
}
pub async fn department_single_merge(
    department: DepartmentModel,
    faculty: Option<&FacultyModel>,
    con: &mut PgConnection,
) -> anyhow::Result<MergeResult> {
    let id = department.department_id;
    let row: Option<DepartmentModel> = sqlx::query_as!(
        DepartmentModel,
        "SELECT * FROM departments WHERE department_id = $1",
        id
    )
    .fetch_optional(&mut *con)
    .await
    .context("Failed to fetch department in department merge")?;

    if let Some(faculty) = faculty {
        if let Err(e) = faculty_single_merge(faculty.clone(), &mut *con).await {
            error!(
                "MERGE::DEPARTMENTS \tFailed to merge faculty {}: {:?}",
                faculty.faculty_id, e
            );
            return Err(anyhow!("Dependency failure in faculty merge"));
        }
    }

    if let Some(row) = row {
        // do not update if faculty is None
        if (faculty.is_some() || row.faculty_id == department.faculty_id) && row != department {
            trace!("MERGE::DEPARTMENTS \tUpdating department {} with title {}: \n old: {:?}, new: {:?}", id, department.title, row, department);
            sqlx::query!(
                "UPDATE departments SET title = $1, long_title = $2, \
            department_type = $3, faculty_id = $4 WHERE department_id = $5",
                department.title,
                department.long_title,
                department.department_type,
                department.faculty_id,
                department.department_id
            )
            .execute(&mut *con)
            .await
            .context("Failed to update department in department merge")?;
            info!(
                "Department [CHANGED]: ({}): {}",
                department.department_id, department.title
            );

            Ok(MergeResult::Updated)
        } else {
            Ok(MergeResult::NotModified)
        }
    } else {
        trace!(
            "MERGE::DEPARTMENTS \tNew department: {} with title {}",
            id,
            department.title
        );
        sqlx::query!(
            "INSERT INTO departments (department_id, title, \
        long_title, department_type, faculty_id) VALUES ($1, $2, $3, $4, $5)",
            department.department_id,
            department.title,
            department.long_title,
            department.department_type,
            department.faculty_id
        )
        .execute(con)
        .await
        .context("Failed to insert department")?;
        info!(
            "Department [INSERTED]: ({}): {}",
            department.department_id, department.title
        );

        Ok(MergeResult::Inserted)
    }
}

async fn group_single_merge(
    group: &GroupModel,
    department: Option<&DepartmentModel>,
    faculty: Option<&FacultyModel>,
    con: &mut PgConnection,
) -> anyhow::Result<MergeResult> {
    let id = group.group_id;
    let row: Option<GroupModel> =
        sqlx::query_as!(GroupModel, "SELECT * FROM groups WHERE group_id = $1", id)
            .fetch_optional(&mut *con)
            .await
            .context("Failed to fetch group in group merge")?;

    if let Some(department) = department {
        if let Err(e) = department_single_merge(department.clone(), faculty, &mut *con).await {
            error!(
                "MERGE::GROUPS \tFailed to merge department {}: {:?}",
                department.department_id, e
            );
            return Err(anyhow!("Dependency failure in department merge"));
        }
    }

    if let Some(row) = row {
        let is_different = row.studying_type != group.studying_type
            || row.education_level != group.education_level
            || row.start_year != group.start_year
            || row.end_year != group.end_year
            || row.department_id != group.department_id
            || row.specialty_id != group.specialty_id;

        if is_different {
            trace!(
                "MERGE::GROUPS \tUpdating group {} with number {}: \n old: {:?}, new: {:?}",
                id,
                group.number,
                row,
                *group
            );
            sqlx::query!(
                "UPDATE groups SET number = $1, studying_type = $2, \
            education_level = $3, start_year = $4, end_year = $5, department_id = $6, \
            specialty_id = $7 WHERE group_id = $8",
                group.number,
                group.studying_type,
                group.education_level,
                group.start_year,
                group.end_year,
                group.department_id,
                group.specialty_id,
                group.group_id
            )
            .execute(con)
            .await
            .context("Failed to update group in group merge")?;
            info!("Group [CHANGED]: ({}): {}", group.group_id, group.number);

            Ok(MergeResult::Updated)
        } else {
            Ok(MergeResult::NotModified)
        }
    } else {
        trace!(
            "MERGE::GROUPS \tNew group: {} with number {}",
            id,
            group.number
        );
        sqlx::query!("INSERT INTO groups (group_id, number, studying_type, \
        education_level, start_year, end_year, department_id, specialty_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            group.group_id, group.number, group.studying_type, group.education_level,
            group.start_year, group.end_year, group.department_id, group.specialty_id)
            .execute(con)
            .await.context("Failed to insert group in group merge")?;
        info!("Group [INSERTED]: ({}): {}", group.group_id, group.number);

        Ok(MergeResult::Inserted)
    }
}

pub async fn groups_merge(
    groups: &Vec<GroupOriginal>,
    con: &mut PgConnection,
) -> anyhow::Result<()> {
    info!("MERGE::GROUPS Merging started!");
    let start = std::time::Instant::now();

    let mut changed_cnt = 0;
    let mut inserted_cnt = 0;
    for group in groups.iter() {
        let group_model = group.as_model();
        let department_model = group.department.as_model();
        let faculty_model = group.department.faculty.as_model();
        let res = group_single_merge(
            &group_model,
            Some(&department_model),
            Some(&faculty_model),
            con,
        )
        .await
        .context("Failed to merge group")?;

        if MergeResult::Updated == res {
            changed_cnt += 1;
        }
        if MergeResult::Inserted == res {
            inserted_cnt += 1;
        }
    }

    if changed_cnt > 0 || inserted_cnt > 0 {
        info!("MERGE::GROUPS Merging groups finished with changes!");
        info!("MERGE::GROUPS \tinserted: {}", inserted_cnt);
        info!("MERGE::GROUPS \tchanged: {}", changed_cnt);
    } else {
        info!("MERGE::GROUPS Merging groups: \tno changes")
    }
    info!(
        "MERGE::GROUPS Merging groups finished in {:?}!",
        start.elapsed()
    );
    info!("");
    Ok(())
}
