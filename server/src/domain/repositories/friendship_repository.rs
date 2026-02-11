use crate::domain::entities::friendships::{
    FriendshipEntity, NewFriendshipEntity, PendingRequestDto,
};
use async_trait::async_trait;

#[async_trait]
pub trait FriendshipRepository: Send + Sync {
    async fn create(&self, friendship: NewFriendshipEntity) -> Result<FriendshipEntity, String>;
    async fn find_by_id(&self, id: i32) -> Result<Option<FriendshipEntity>, String>;
    async fn find_by_users(
        &self,
        user1_id: i32,
        user2_id: i32,
    ) -> Result<Option<FriendshipEntity>, String>;
    async fn update_status(&self, id: i32, status: &str) -> Result<FriendshipEntity, String>;
    async fn delete(&self, id: i32) -> Result<(), String>;
    async fn list_friends(&self, user_id: i32) -> Result<Vec<i32>, String>;
    async fn list_pending_requests(&self, user_id: i32) -> Result<Vec<PendingRequestDto>, String>;
}
