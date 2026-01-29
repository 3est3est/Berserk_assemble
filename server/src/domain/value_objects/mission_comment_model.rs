use chrono::NaiveDateTime;
use diesel::{
    QueryableByName,
    sql_types::{Int4, Text, Timestamp, Varchar},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, QueryableByName)]
pub struct MissionCommentModel {
    #[diesel(sql_type = Int4)]
    pub id: i32,
    #[diesel(sql_type = Int4)]
    pub mission_id: i32,
    #[diesel(sql_type = Int4)]
    pub brawler_id: i32,
    #[diesel(sql_type = Varchar)]
    pub brawler_display_name: String,
    #[diesel(sql_type = Varchar)]
    pub brawler_avatar_url: String,
    #[diesel(sql_type = Text)]
    pub content: String,
    #[diesel(sql_type = Timestamp)]
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddMissionCommentModel {
    pub content: String,
}
