use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::infrastructure::database::schema::notifications;

#[derive(Debug, Clone, Identifiable, Selectable, Queryable, Serialize, Deserialize)]
#[diesel(check_for_backend(diesel::pg::Pg))]
#[diesel(table_name = notifications)]
pub struct NotificationEntity {
    pub id: i32,
    pub brawler_id: i32,
    #[serde(rename = "type")]
    pub type_: String,
    pub content: String,
    pub related_id: Option<i32>,
    pub is_read: bool,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = notifications)]
pub struct AddNotificationEntity {
    pub brawler_id: i32,
    pub type_: String,
    pub content: String,
    pub related_id: Option<i32>,
}
