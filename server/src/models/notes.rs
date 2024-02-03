use crate::models::DbResult;
use sqlx::PgConnection;
use std::collections::BTreeMap;
use time::PrimitiveDateTime;

#[derive(Debug, sqlx::FromRow)]
pub struct UserNote {
    pub user_id: i32,
    pub schedule_obj_time_link_id: i32,
    pub text: String,
    pub week_num: i32,

    pub creation_timestamp: PrimitiveDateTime,
    pub modified_timestamp: Option<PrimitiveDateTime>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct GroupNote {
    pub group_id: i32,
    pub schedule_obj_time_link_id: i32,
    pub text: String,
    pub week_num: i32,

    pub creation_timestamp: PrimitiveDateTime,
    pub modified_timestamp: Option<PrimitiveDateTime>,
}

// User notes

pub async fn create_update_user_note(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_id: i32,
    text: String,
    week_num: i32,
) -> DbResult<()> {
    //insert entry
    debug!("Inserting note for user {} with schedule_obj_time_link_id {} and week_num {} with value {}", user_id, schedule_obj_time_link_id, week_num, text);
    sqlx::query!("INSERT INTO user_notes (user_id, schedule_obj_time_link_id, text, week_num, modified_timestamp) \
    VALUES ($1, $2, $3, $4, now()) \
    ON CONFLICT(user_id, schedule_obj_time_link_id, week_num) DO UPDATE SET text = $3, modified_timestamp = now()",
        user_id, schedule_obj_time_link_id, text, week_num)
        .execute(&mut *con).await?;

    Ok(())
}

pub async fn get_user_notes(
    con: &mut PgConnection,
    user_id: i32,
) -> DbResult<BTreeMap<i32, Vec<(String, i32)>>> {
    // get user notes
    let res: Vec<UserNote> = sqlx::query_as!(
        UserNote,
        "SELECT user_notes.* FROM user_notes join schedule_objs \
        on user_notes.schedule_obj_time_link_id = schedule_objs.time_link_id \
        WHERE user_id = $1 AND gen_end IS NULL",
        user_id
    )
    .fetch_all(&mut *con)
    .await?;

    let mut map: BTreeMap<i32, Vec<(String, i32)>> = BTreeMap::new();
    for item in res {
        map.entry(item.week_num)
            .or_default()
            .push((item.text, item.schedule_obj_time_link_id));
    }

    Ok(map)
}

pub async fn is_user_note_exists(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_id: i32,
    week_num: i32,
) -> DbResult<bool> {
    let res = sqlx::query_scalar!(
        "SELECT 1 FROM user_notes WHERE user_id = $1 AND schedule_obj_time_link_id = $2 AND week_num = $3",
        user_id, schedule_obj_time_link_id, week_num
    ).fetch_optional(&mut *con).await?;

    Ok(res.is_some())
}

pub async fn delete_user_note(
    con: &mut PgConnection,
    user_id: i32,
    schedule_obj_time_link_id: i32,
    week_num: i32,
) -> DbResult<()> {
    sqlx::query!(
        "DELETE FROM user_notes WHERE user_id = $1 AND schedule_obj_time_link_id = $2 AND week_num = $3",
        user_id, schedule_obj_time_link_id, week_num
    ).execute(&mut *con).await?;

    Ok(())
}

// Group notes

pub async fn create_update_group_note(
    con: &mut PgConnection,
    group_id: i32,
    schedule_obj_time_link_id: i32,
    text: String,
    week_num: i32,
) -> DbResult<()> {
    //insert entry
    debug!("Inserting note for group {} with schedule_obj_time_link_id {} and week_num {} with value {}", group_id, schedule_obj_time_link_id, week_num, text);
    sqlx::query!("INSERT INTO group_notes (group_id, schedule_obj_time_link_id, text, week_num, modified_timestamp) \
    VALUES ($1, $2, $3, $4, now()) \
    ON CONFLICT(group_id, schedule_obj_time_link_id, week_num) DO UPDATE SET text = $3, modified_timestamp = now()",
        group_id, schedule_obj_time_link_id, text, week_num)
        .execute(&mut *con).await?;

    Ok(())
}

pub async fn get_group_notes(
    con: &mut PgConnection,
    group_id: i32,
) -> DbResult<BTreeMap<i32, Vec<(String, i32)>>> {
    // get user notes
    let res: Vec<GroupNote> = sqlx::query_as!(
        GroupNote,
        "SELECT group_notes.* FROM group_notes join schedule_objs \
        on group_notes.schedule_obj_time_link_id = schedule_objs.time_link_id \
        WHERE group_notes.group_id = $1 AND gen_end IS NULL",
        group_id
    )
    .fetch_all(&mut *con)
    .await?;

    let mut map: BTreeMap<i32, Vec<(String, i32)>> = BTreeMap::new();
    for item in res {
        map.entry(item.week_num)
            .or_default()
            .push((item.text, item.schedule_obj_time_link_id));
    }

    Ok(map)
}

pub async fn is_group_note_exists(
    con: &mut PgConnection,
    group_id: i32,
    schedule_obj_time_link_id: i32,
    week_num: i32,
) -> DbResult<bool> {
    let res = sqlx::query_scalar!(
        "SELECT 1 FROM group_notes WHERE group_id = $1 AND schedule_obj_time_link_id = $2 AND week_num = $3",
        group_id, schedule_obj_time_link_id, week_num
    ).fetch_optional(&mut *con).await?;

    Ok(res.is_some())
}

pub async fn delete_group_note(
    con: &mut PgConnection,
    group_id: i32,
    schedule_obj_time_link_id: i32,
    week_num: i32,
) -> DbResult<()> {
    sqlx::query!(
        "DELETE FROM group_notes WHERE group_id = $1 AND schedule_obj_time_link_id = $2 AND week_num = $3",
        group_id, schedule_obj_time_link_id, week_num
    ).execute(&mut *con).await?;

    Ok(())
}
