use crate::domain::value_objects::mission_comment_model::MissionCommentModel;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait MissionCommentRepository {
    async fn add(
        &self,
        mission_id: i32,
        brawler_id: i32,
        content: &str,
    ) -> Result<MissionCommentModel>;
    async fn get_by_mission_id(&self, mission_id: i32) -> Result<Vec<MissionCommentModel>>;
    async fn clear_by_mission_id(&self, mission_id: i32) -> Result<()>;
}
