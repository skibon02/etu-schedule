use reqwest::Response;
use serde_json::Value;
use std::{fs, sync::{OnceLock, Arc}};

static VK_APP_ID: &str = "7918120";
pub static VK_SERVICE_TOKEN: OnceLock<Arc<str>> = OnceLock::new();

fn get_app_service_token() -> Arc<str> {
    VK_SERVICE_TOKEN.get().cloned().unwrap()
}

async fn get_user_info(access_token: &str) -> String {
    let response: Response = reqwest::Client::new()
        .get("https://api.vk.com/method/users.get")
        .query(&[
            ("fields", "photo_200, about, bdate"),
            ("access_token", access_token),
            ("v", "5.131"),
        ])
        .send()
        .await
        .unwrap();

    let json: Value = response.json().await.unwrap();
    debug!("> VK: get_user_info response: {:?}", json);
    let user_id = json["response"][0]["id"].as_u64().unwrap();
    user_id.to_string()
}

/// Gives access token and user id
pub async fn exchange_access_token(silent_token: &str, uuid: &str) -> (String, String) {
    let response: Response = reqwest::Client::new()
        .get("https://api.vk.com/method/auth.exchangeSilentAuthToken")
        .query(&[
            ("uuid", uuid),
            ("token", silent_token),
            ("access_token", &get_app_service_token()),
            ("v", "5.131"),
        ])
        .send()
        .await
        .unwrap();


    let json: Value = response.json().await.unwrap();
    debug!("> VK: exchange_access_token response: {:?}", json);
    let access_token = json["response"]["access_token"].as_str().unwrap();

    let user_id = get_user_info(access_token).await;
    (access_token.to_string(), user_id)
}

