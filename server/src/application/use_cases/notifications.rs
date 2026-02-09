use crate::domain::{
    entities::notifications::{AddNotificationEntity, NotificationEntity},
    repositories::notifications::NotificationRepository,
};
use anyhow::Result;
use std::sync::Arc;

pub struct NotificationUseCase {
    repo: Arc<dyn NotificationRepository>,
}

impl NotificationUseCase {
    pub fn new(repo: Arc<dyn NotificationRepository>) -> Self {
        Self { repo }
    }

    pub async fn get_my_notifications(&self, user_id: i32) -> Result<Vec<NotificationEntity>> {
        self.repo.get_by_user(user_id).await
    }

    pub async fn mark_as_read(&self, notification_id: i32, user_id: i32) -> Result<()> {
        self.repo.mark_as_read(notification_id, user_id).await
    }

    pub async fn mark_all_as_read(&self, user_id: i32) -> Result<()> {
        self.repo.mark_all_as_read(user_id).await
    }

    pub async fn save_notification(
        &self,
        user_id: i32,
        msg_type: &str,
        content: &str,
        related_id: Option<i32>,
    ) -> Result<NotificationEntity> {
        let entity = AddNotificationEntity {
            brawler_id: user_id,
            type_: msg_type.to_string(),
            content: content.to_string(),
            related_id,
        };
        self.repo.add(entity).await
    }
}
