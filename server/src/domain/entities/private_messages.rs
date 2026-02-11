use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PrivateMessage {
    pub id: i32,
    pub sender_id: i32,
    pub sender_display_name: Option<String>,
    pub sender_avatar_url: Option<String>,
    pub receiver_id: i32,
    pub receiver_display_name: Option<String>,
    pub receiver_avatar_url: Option<String>,
    pub content: String,
    pub is_read: bool,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePrivateMessage {
    pub receiver_id: i32,
    pub content: String,
}
