use crate::domain::entities::private_messages::PrivateMessage;
use async_trait::async_trait;

#[async_trait]
pub trait PrivateMessageRepository: Send + Sync {
    async fn save(
        &self,
        sender_id: i32,
        receiver_id: i32,
        content: String,
    ) -> Result<PrivateMessage, String>;
    async fn get_conversation(
        &self,
        user1_id: i32,
        user2_id: i32,
    ) -> Result<Vec<PrivateMessage>, String>;
    async fn mark_as_read(&self, receiver_id: i32, sender_id: i32) -> Result<(), String>;
    async fn get_unread_count(&self, user_id: i32) -> Result<i64, String>;
    async fn get_recent_chats(&self, user_id: i32) -> Result<Vec<PrivateMessage>, String>;
}
