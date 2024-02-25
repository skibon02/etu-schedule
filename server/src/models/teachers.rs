use crate::models::DbResult;
use anyhow::Context;
use rocket::time::PrimitiveDateTime;
use sqlx::PgConnection;

#[derive(sqlx::FromRow, Debug, Clone, PartialEq)]
pub struct TeacherModel {
    pub teacher_obj_id: i32,
    pub teacher_id: i32,

    // tracked with versioning
    pub initials: String,
    pub name: String,
    pub surname: String,
    pub midname: String,
    pub birthday: String,
    pub email: Option<String>,
    pub group_id: Option<i32>,
    pub is_worker: bool,
    pub is_department_head: bool,
    pub is_department_dispatcher: bool,
    pub is_student: bool,
    pub position: Option<String>,
    pub degree: Option<String>,
    pub rank: Option<String>,

    // untracked_info

    // generation range info
    pub gen_start: i32,
    pub gen_end: Option<i32>,
    pub existence_diff: String,

    pub created_timestamp: PrimitiveDateTime,
    pub modified_timestamp: PrimitiveDateTime,
}

pub async fn get_teachers_cur_gen(con: &mut PgConnection) -> DbResult<i32> {
    let res: Option<i32> =
        sqlx::query_scalar!("SELECT MAX(gen_id) as max FROM teachers_generation")
            .fetch_one(&mut *con)
            .await
            .context("Failed to get current teachers generation")?;

    Ok(res.unwrap_or(0))
}

pub async fn create_new_gen(con: &mut PgConnection, gen_id: i32) -> DbResult<()> {
    // info!("Creating new teachers generation {}", gen_id);
    sqlx::query!("INSERT INTO teachers_generation (gen_id, creation_time) VALUES ($1, NOW()) ON CONFLICT DO NOTHING",
                gen_id)
        .execute(con)
        .await.context("Failed to insert new teachers generation")?;

    Ok(())
}

pub async fn get_teachers_for_group(
    con: &mut PgConnection,
    group_id: i32,
) -> DbResult<Vec<TeacherModel>> {
    let res = sqlx::query_as!(TeacherModel,
        "SELECT DISTINCT teachers.* FROM teachers join schedule_objs_teachers
            ON schedule_objs_teachers.teacher_id = teachers.teacher_id 
            JOIN schedule_objs ON schedule_objs_teachers.schedule_obj_id = schedule_objs.schedule_obj_id
            WHERE teachers.gen_start <= schedule_objs.teacher_gen_id 
            AND (teachers.gen_end IS null OR teachers.gen_end > schedule_objs.teacher_gen_id) 
            AND schedule_objs.gen_end IS NULL and schedule_objs.group_id = $1",
        group_id)
        .fetch_all(&mut *con).await.context("Failed to get group current first teachers")?;


    Ok(res)
}

pub async fn get_teacher_departments(
    teacher_id: i32,
    con: &mut PgConnection,
) -> DbResult<Vec<String>> {
    let res = sqlx::query!(
        "select department from teachers_departments WHERE teacher_id = $1",
        teacher_id
    )
    .fetch_all(&mut *con)
    .await
    .context("Failed to get teacher departments")?;

    let res = res.into_iter().map(|r| r.department).collect();

    Ok(res)
}

pub async fn get_cur_gen_teacher_by_id(
    teacher_id: i32,
    con: &mut PgConnection,
) -> DbResult<Option<TeacherModel>> {
    let res = sqlx::query_as!(
        TeacherModel,
        "SELECT * FROM teachers WHERE teacher_id = $1 AND gen_end IS NULL",
        teacher_id
    )
    .fetch_optional(con)
    .await
    .context("Failed to fetch teacher in teacher merge")?;

    Ok(res)
}
