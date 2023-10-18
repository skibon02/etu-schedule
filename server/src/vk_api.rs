use reqwest::Response;
use serde_json::Value;

fn get_app_service_token() -> String {
    "ce8cae57ce8cae57ce8cae5722cd995602cce8cce8cae57aba0bd34f16053461d68fcd2".to_string()
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
    println!("get_user_info response: {:?}", json);
    let user_id = json["response"][0]["id"].as_u64().unwrap();
    user_id.to_string()
}

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
    println!("exchange_access_token response: {:?}", json);
    let access_token = json["response"]["access_token"].as_str().unwrap();

    let user_id = get_user_info(access_token).await;
    (access_token.to_string(), user_id)
}

