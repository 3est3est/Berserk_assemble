use crate::domain::entities::notifications::{AddNotificationEntity, NotificationEntity};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait NotificationRepository: Send + Sync {
    async fn add(&self, notification: AddNotificationEntity) -> Result<NotificationEntity>;
    async fn get_by_user(&self, user_id: i32) -> Result<Vec<NotificationEntity>>;
    async fn mark_as_read(&self, notification_id: i32, user_id: i32) -> Result<()>;
    async fn mark_all_as_read(&self, user_id: i32) -> Result<()>;
    async fn delete_for_user(&self, user_id: i32) -> Result<()>;
}
