use anyhow::Result;
use async_trait::async_trait;

use crate::domain::{
    entities::crew_memberships::CrewMemberShips, value_objects::mission_model::MissionModel,
};

#[async_trait]
pub trait CrewOperationRepository {
    async fn join(&self, crew_member_ships: CrewMemberShips) -> Result<()>;
    async fn leave(&self, crew_member_ships: CrewMemberShips) -> Result<()>;
    /// ดึงภารกิจที่ brawler เข้าร่วมอยู่ (เป็น crew member)
    async fn get_my_joined_missions(&self, brawler_id: i32) -> Result<Vec<MissionModel>>;
}
