use std::sync::Arc;

use anyhow::Result;

use crate::domain::{
    repositories::mission_viewing::MissionViewingRepository,
    value_objects::{
        brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel,
    },
};

pub struct MissionViewingUseCase<T>
where
    T: MissionViewingRepository,
{
    pub repository: Arc<T>,
}

impl<T> MissionViewingUseCase<T>
where
    T: MissionViewingRepository,
{
    pub fn new(repository: Arc<T>) -> Self {
        Self { repository }
    }

    pub async fn get_one(&self, mission_id: i32) -> Result<MissionModel> {
        self.repository.get_one(mission_id).await
    }

    pub async fn get_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        self.repository.get_crew(mission_id).await
    }

    pub async fn get_all(&self, mission_filter: &MissionFilter) -> Result<Vec<MissionModel>> {
        self.repository.get_all(mission_filter).await
    }
}
