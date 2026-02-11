use crate::infrastructure::database::schema::friendships;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::Serialize;

#[derive(Debug, Clone, Identifiable, Selectable, Queryable, Serialize)]
#[diesel(table_name = friendships)]
pub struct FriendshipEntity {
    pub id: i32,
    pub requester_id: i32,
    pub receiver_id: i32,
    pub status: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = friendships)]
pub struct NewFriendshipEntity {
    pub requester_id: i32,
    pub receiver_id: i32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PendingRequestDto {
    pub id: i32,
    pub requester_id: i32,
    pub requester_name: String,
    pub requester_avatar: Option<String>,
    pub created_at: NaiveDateTime,
}
