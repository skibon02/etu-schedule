use std::collections::BTreeMap;
use rocket::Route;
use rocket::serde::json::Json;
use serde_derive::{Deserialize, Serialize};
use crate::models;
use crate::routes::ResponseErrorMessage;

use crate::models::Db;
use crate::routes::auth::AuthorizeInfo;
use rocket_db_pools::Connection;

#[derive(Deserialize)]
pub struct CreateUserNoteRequest {
    schedule_obj_time_link_id: i32,
    week_num: i32,
    text: String
}

#[derive(Serialize)]
pub struct CreateUserNoteResultSuccess {
    ok: bool,
    action: String
}
#[derive(Responder)]
pub enum CreateUserNoteRequestResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<CreateUserNoteResultSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}
type CreateRes = CreateUserNoteRequestResult;

#[post("/notes/create_update", data = "<data>")]
pub async fn create_update_user_note(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, data: Json<CreateUserNoteRequest>) -> CreateUserNoteRequestResult {
    if auth.is_none() {
        return CreateRes::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // check valid week number
    // TODO: use etu api to get semester start and end dates
    if data.week_num > 52 {
        return CreateRes::Failed(Json(ResponseErrorMessage::new("week_num is too big!".to_string())));
    }

    // check valid time link id
    let res = models::schedule::is_time_link_id_valid_for_user(&mut db, data.schedule_obj_time_link_id, auth.user_id).await;
    match res {
        Err(e) => {
            error!("Failed to check time link id for user: {:?}", e);
            return CreateRes::Failed(Json(ResponseErrorMessage::new("Failed to check time link id valid for user!".to_string())));
        }
        Ok(res) => {
            match res {
                models::schedule::TimeLinkValidResult::Success(r) =>  {
                    if !r {
                        return CreateRes::Failed(Json(ResponseErrorMessage::new("schedule_obj_time_link_id is not valid for user!".to_string())));
                    }
                },
                models::schedule::TimeLinkValidResult::ErrorUserMessage(msg) => {
                    return CreateRes::Failed(Json(ResponseErrorMessage::new(msg)));
                }
            }
        }
    }

    let note_exists = models::notes::is_user_note_exists(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.week_num).await;

    //insert entry
    let res = models::notes::create_update_user_note(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.text.clone(), data.week_num).await;

    if let Err(e) = res {
        error!("Failed to set user attendance schedule diff: {:?}", e);
        return CreateRes::Failed(Json(ResponseErrorMessage::new("Failed to set user attendance schedule!".to_string())));
    }

    let action = if note_exists.unwrap() { "updated" } else { "created" };

    CreateRes::Success(Json(CreateUserNoteResultSuccess { ok: true, action: action.to_string() }))
}



#[derive(Serialize)]
struct UserNotesWeek {
    week_id: i32,
    user_notes: BTreeMap<i32, String>
}

#[derive(Serialize)]
struct UserNotesObj {
    weeks: BTreeMap<i32, UserNotesWeek>
}

#[derive(Responder)]
pub enum GetUserNotesResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<UserNotesObj>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}
type GetRes = GetUserNotesResult;

#[get("/notes")]
pub async fn get_user_notes(mut db: Connection<Db>, auth: Option<AuthorizeInfo>) -> GetUserNotesResult {
    if auth.is_none() {
        return GetRes::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // get user saved attendance schedule elements
    let group_id = models::users::get_user_group(&mut db, auth.user_id).await;
    if let Err(e) = group_id {
        error!("Failed to get user group: {:?}", e);
        return GetRes::Failed(Json(ResponseErrorMessage::new("Failed to get user group!".to_string())));
    }
    let group_id = group_id.unwrap();

    if group_id.is_none() {
        return GetRes::Failed(Json(ResponseErrorMessage::new("User has no group!".to_string())));
    }
    let group_id = group_id.unwrap().group_id;

    // get user notes
    let res = models::notes::get_user_notes(&mut db, auth.user_id).await;

    match res {
        Err(e) => {
            error!("Failed to get user notes: {:?}", e);
            GetRes::Failed(Json(ResponseErrorMessage::new("Failed to get user notes!".to_string())))
        }
        Ok(res) => {
            let map = res.iter().map(|(&week_id, notes)| {
                let notes_map: BTreeMap<_,_> = notes.iter().map(|note| {
                    (note.1, note.0.clone())
                }).collect();

                (week_id, UserNotesWeek { week_id, user_notes: notes_map })
            }).collect();
            GetRes::Success(Json(UserNotesObj { weeks: map }))
        }
    }
}

#[derive(Deserialize)]
pub struct DeleteUserNoteRequest {
    schedule_obj_time_link_id: i32,
    week_num: i32
}

#[derive(Serialize)]
pub struct DeleteUserNoteResultSuccess {
    ok: bool
}

#[derive(Responder)]
pub enum DeleteUserNoteRequestResult {
    #[response(status = 200, content_type = "json")]
    Success(Json<DeleteUserNoteResultSuccess>),
    #[response(status = 400, content_type = "json")]
    Failed(Json<ResponseErrorMessage>),
}

type DeleteRes = DeleteUserNoteRequestResult;

#[delete("/notes", data = "<data>")]
pub async fn delete_user_note(mut db: Connection<Db>, auth: Option<AuthorizeInfo>, data: Json<DeleteUserNoteRequest>) -> DeleteUserNoteRequestResult {
    if auth.is_none() {
        return DeleteRes::Failed(Json(ResponseErrorMessage::new("User is not authorized!".to_string())));
    }
    let auth = auth.unwrap();

    // check valid time link id
    let res = models::schedule::is_time_link_id_valid_for_user(&mut db, data.schedule_obj_time_link_id, auth.user_id).await;
    match res {
        Err(e) => {
            error!("Failed to check time link id for user: {:?}", e);
            return DeleteRes::Failed(Json(ResponseErrorMessage::new("Failed to check time link id valid for user!".to_string())));
        }
        Ok(res) => {
            match res {
                models::schedule::TimeLinkValidResult::Success(r) =>  {
                    if !r {
                        return DeleteRes::Failed(Json(ResponseErrorMessage::new("schedule_obj_time_link_id is not valid for user!".to_string())));
                    }
                },
                models::schedule::TimeLinkValidResult::ErrorUserMessage(msg) => {
                    return DeleteRes::Failed(Json(ResponseErrorMessage::new(msg)));
                }
            }
        }
    }

    let note_exists = models::notes::is_user_note_exists(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.week_num).await;

    if !note_exists.unwrap() {
        return DeleteRes::Failed(Json(ResponseErrorMessage::new("Note not found!".to_string())));
    }

    let res = models::notes::delete_user_note(&mut db, auth.user_id, data.schedule_obj_time_link_id, data.week_num).await;

    if let Err(e) = res {
        error!("Failed to delete user note: {:?}", e);
        return DeleteRes::Failed(Json(ResponseErrorMessage::new("Failed to delete user note!".to_string())));
    }

    DeleteRes::Success(Json(DeleteUserNoteResultSuccess { ok: true }))
}



pub fn get_routes() -> Vec<Route> {
    routes![ create_update_user_note, get_user_notes, delete_user_note]
}
