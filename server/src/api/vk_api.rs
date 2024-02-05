use reqwest::Response;
use rocket::serde::json::Json;
use serde_json::Value;
use std::sync::{Arc, OnceLock};
use std::time::Duration;

#[allow(dead_code)]
static VK_APP_ID: &str = "7918120";
pub static VK_SERVICE_TOKEN: OnceLock<Arc<str>> = OnceLock::new();

fn get_app_service_token() -> Arc<str> {
    VK_SERVICE_TOKEN.get().cloned().unwrap()
}

pub async fn users_get(access_token: &str, fields: &str) -> Option<Json<Value>> {
    let response: Response = reqwest::Client::new()
        .get("https://api.vk.com/method/users.get")
        .query(&[
            ("fields", fields),
            ("access_token", access_token),
            ("v", "5.131"),
        ])
        .timeout(Duration::from_secs(2))
        .send()
        .await
        .ok()?;

    let json: Value = response.json().await.ok()?;
    debug!("> VK: get_user_info response: {:?}", json);
    let user_id = json["response"][0].clone();
    Some(Json(user_id))
}

/// takes silent token and returns access token
pub async fn exchange_access_token(silent_token: &str, uuid: &str) -> Option<String> {
    let response: Response = reqwest::Client::new()
        .get("https://api.vk.com/method/auth.exchangeSilentAuthToken")
        .query(&[
            ("uuid", uuid),
            ("token", silent_token),
            ("access_token", &get_app_service_token()),
            ("v", "5.131"),
        ])
        .timeout(Duration::from_secs(2))
        .send()
        .await
        .unwrap();

    let json: Value = response.json().await.unwrap();
    debug!("> VK: exchange_access_token response: {:?}", json);
    let access_token = json["response"]["access_token"].as_str().unwrap();

    Some(access_token.to_string())
}

pub async fn send_message(token: String, peer_id: u32, message: String) -> Option<Json<Value>> {
    let random_id = rand::random::<u32>();
    let response: Response = reqwest::Client::new()
        .get("https://api.vk.com/method/messages.send")
        .query(&[
            ("user_id", &peer_id.to_string()),
            ("message", &message),
            ("access_token", &token),
            ("random_id", &random_id.to_string()),
            ("v", &"5.131".to_string()),
        ])
        .timeout(Duration::from_secs(2))
        .send()
        .await
        .ok()?;

    let json: Value = response.json().await.ok()?;
    info!("> VK: send_message response: {:?}", json);
    Some(Json(json))
}
