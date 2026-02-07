use crate::domain::{
    repositories::{
        mission_comment::MissionCommentRepository, mission_viewing::MissionViewingRepository,
    },
    value_objects::mission_comment_model::MissionCommentModel,
};
use anyhow::Result;
use std::sync::Arc;

pub struct MissionCommentUseCase<T1, T2>
where
    T1: MissionCommentRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
{
    pub repository: Arc<T1>,
    pub mission_viewing_repository: Arc<T2>,
}

impl<T1, T2> MissionCommentUseCase<T1, T2>
where
    T1: MissionCommentRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
{
    pub fn new(repository: Arc<T1>, mission_viewing_repository: Arc<T2>) -> Self {
        Self {
            repository,
            mission_viewing_repository,
        }
    }

    pub async fn add_comment(
        &self,
        mission_id: i32,
        brawler_id: i32,
        content: &str,
    ) -> Result<MissionCommentModel> {
        // 1. Check if user is chief or member
        let mission = self.mission_viewing_repository.get_one(mission_id).await?;

        if mission.deleted_at.is_some() {
            return Err(anyhow::anyhow!(
                "This mission has been removed. Chat is disabled."
            ));
        }

        let crew = self.mission_viewing_repository.get_crew(mission_id).await?;

        let is_chief = mission.chief_id == brawler_id;
        let is_member = crew.iter().any(|m| m.id == brawler_id);

        if !is_chief && !is_member {
            return Err(anyhow::anyhow!(
                "You are not authorized to post in this mission's chat."
            ));
        }

        self.repository.add(mission_id, brawler_id, content).await
    }

    pub async fn get_comments(&self, mission_id: i32) -> Result<Vec<MissionCommentModel>> {
        self.repository.get_by_mission_id(mission_id).await
    }

    pub async fn clear_comments(&self, mission_id: i32, brawler_id: i32) -> Result<()> {
        let mission = self.mission_viewing_repository.get_one(mission_id).await?;
        if mission.chief_id != brawler_id {
            return Err(anyhow::anyhow!("Only the chief can clear the chat!"));
        }
        self.repository.clear_by_mission_id(mission_id).await
    }
}
