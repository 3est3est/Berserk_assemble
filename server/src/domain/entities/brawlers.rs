use crate::infrastructure::database::schema::brawlers;
use chrono::NaiveDateTime;
use diesel::{Selectable, prelude::*};
use serde::Serialize;

#[derive(Debug, Clone, Identifiable, Selectable, Queryable, Serialize)]
#[diesel(table_name = brawlers)]
pub struct BrawlerEntity {
    pub id: i32,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub avatar_public_id: Option<String>,
    pub bio: Option<String>,
    pub discord_id: Option<String>,
    pub contact_email: Option<String>,
    pub instagram: Option<String>,
    pub facebook: Option<String>,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = brawlers)]
pub struct RegisterBrawlerEntity {
    pub username: String,
    pub password: String,
    pub display_name: String,
}
