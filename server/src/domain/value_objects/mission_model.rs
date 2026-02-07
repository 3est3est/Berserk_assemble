use chrono::{DateTime, NaiveDateTime, Utc};
use diesel::{
    QueryableByName,
    sql_types::{BigInt, Int4, Nullable, Text, Timestamp, Varchar},
};
use serde::{Deserialize, Serialize};

use crate::domain::{
    entities::missions::{AddMissionEntity, EditMissionEntity},
    value_objects::mission_statuses::MissionStatuses,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, QueryableByName)]
pub struct MissionModel {
    #[diesel(sql_type = Int4)]
    pub id: i32,
    #[diesel(sql_type = Varchar)]
    pub name: String,
    #[diesel(sql_type = Nullable<Text>)]
    pub description: Option<String>,
    #[diesel(sql_type = Varchar)]
    pub status: String,
    #[diesel(sql_type = Int4)]
    pub chief_id: i32,
    #[diesel(sql_type = Varchar)]
    pub chief_display_name: String,
    #[diesel(sql_type = Varchar)]
    pub chief_avatar_url: String,
    #[diesel(sql_type = BigInt)]
    pub crew_count: i64,
    #[diesel(sql_type = Int4)]
    pub max_crew: i32,
    #[diesel(sql_type = Timestamp)]
    pub created_at: NaiveDateTime,
    #[diesel(sql_type = Timestamp)]
    pub updated_at: NaiveDateTime,
    #[diesel(sql_type = Nullable<Timestamp>)]
    pub scheduled_at: Option<NaiveDateTime>,
    #[diesel(sql_type = Nullable<Varchar>)]
    pub location: Option<String>,
    #[diesel(sql_type = Nullable<Timestamp>)]
    pub deleted_at: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddMissionModel {
    pub name: String,
    pub description: Option<String>,
    pub max_crew: Option<i32>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub location: Option<String>,
}

impl AddMissionModel {
    pub fn to_entity(&self, chief_id: i32) -> AddMissionEntity {
        AddMissionEntity {
            name: self.name.clone(),
            description: self.description.clone(),
            status: MissionStatuses::Open.to_string(),
            chief_id,
            max_crew: self.max_crew.unwrap_or(5),
            scheduled_at: self.scheduled_at.map(|dt| dt.naive_utc()),
            location: self.location.clone(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditMissionModel {
    pub name: Option<String>,
    pub description: Option<String>,
    pub max_crew: Option<i32>,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub location: Option<String>,
}

impl EditMissionModel {
    pub fn to_entity(&self, chief_id: i32) -> EditMissionEntity {
        EditMissionEntity {
            name: self.name.clone(),
            description: self.description.clone(),
            chief_id,
            max_crew: self.max_crew,
            scheduled_at: self.scheduled_at.map(|dt| dt.naive_utc()),
            location: self.location.clone(),
        }
    }
}
