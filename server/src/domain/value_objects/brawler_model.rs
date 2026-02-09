use diesel::prelude::QueryableByName;
use serde::{Deserialize, Serialize};

use crate::domain::entities::brawlers::RegisterBrawlerEntity;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterBrawlerModel {
    pub username: String,
    pub password: String,
    pub display_name: String,
}

impl RegisterBrawlerModel {
    pub fn to_entity(&self) -> RegisterBrawlerEntity {
        RegisterBrawlerEntity {
            username: self.username.clone(),
            password: self.password.clone(),
            display_name: self.display_name.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, QueryableByName)]
pub struct BrawlerModel {
    #[diesel(sql_type = diesel::sql_types::Int4)]
    pub id: i32,
    #[diesel(sql_type = diesel::sql_types::VarChar)]
    pub display_name: String,
    #[diesel(sql_type = diesel::sql_types::VarChar)]
    pub avatar_url: String,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub mission_success_count: i64,
    #[diesel(sql_type = diesel::sql_types::BigInt)]
    pub mission_join_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBrawlerModel {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub discord_id: Option<String>,
    pub contact_email: Option<String>,
    pub instagram: Option<String>,
    pub facebook: Option<String>,
}
