use crate::api;
use lazy_static::lazy_static;
use std::fs::File;
use std::io::Read;
use std::thread;

#[derive(Debug)]
pub enum EventType {
    ErrorMessage,
    PanicMessage,
}

lazy_static! {
    static ref VK_DIAG_TOKEN: Option<String> =
        File::open("vk_notifier_token.txt").ok().map(|mut f| {
            let mut s = String::new();
            f.read_to_string(&mut s).unwrap();
            s
        });
}

pub static PEER_ID: u32 = 274525427;
pub fn send_vk_message(source: EventType, msg: &str) {
    let Some(vk_token) = VK_DIAG_TOKEN.clone() else {
        return;
    };
    let emoji = match source {
        EventType::ErrorMessage => "🔴",
        EventType::PanicMessage => "🔥🔥🔥",
    };

    let msg = if msg.len() > 8000 {
        format!(
            "*ETU SCHEDULE BOT*\n\n{}{}...\n[Content truncated]",
            emoji,
            &msg[0..8000]
        )
    } else {
        format!("*ETU SCHEDULE BOT*\n\n{}{}", emoji, msg)
    };
    thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            api::vk_api::send_message(vk_token, PEER_ID, msg).await;
        });
    });
}

pub fn notify_important_event(source: EventType, message: &str) {
    send_vk_message(source, message);
}
