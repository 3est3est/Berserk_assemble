use crate::application::use_cases::notifications::NotificationUseCase;
use crate::domain::{
    entities::friendships::{FriendshipEntity, NewFriendshipEntity, PendingRequestDto},
    repositories::{brawlers::BrawlerRepository, friendship_repository::FriendshipRepository},
};
use crate::infrastructure::websocket::handler::WSMessage;
use crate::infrastructure::websocket::manager::ConnectionManager;
use anyhow::{Result, anyhow};
use serde_json::json;
use std::sync::Arc;

pub struct FriendshipUseCase {
    repo: Arc<dyn FriendshipRepository>,
    brawler_repo: Arc<dyn BrawlerRepository + Send + Sync>,
    notification_use_case: Arc<NotificationUseCase>,
    ws_manager: Arc<ConnectionManager>,
}

impl FriendshipUseCase {
    pub fn new(
        repo: Arc<dyn FriendshipRepository>,
        brawler_repo: Arc<dyn BrawlerRepository + Send + Sync>,
        notification_use_case: Arc<NotificationUseCase>,
        ws_manager: Arc<ConnectionManager>,
    ) -> Self {
        Self {
            repo,
            brawler_repo,
            notification_use_case,
            ws_manager,
        }
    }

    pub async fn send_request(
        &self,
        requester_id: i32,
        receiver_id: i32,
    ) -> Result<FriendshipEntity> {
        if requester_id == receiver_id {
            return Err(anyhow!("Cannot add yourself as friend"));
        }

        if let Some(_) = self
            .repo
            .find_by_users(requester_id, receiver_id)
            .await
            .map_err(|e| anyhow!(e))?
        {
            return Err(anyhow!("Friendship already exists or pending"));
        }

        // Fetch requester name
        let requester_name = match self.brawler_repo.find_by_id(requester_id).await {
            Ok(u) => u.display_name,
            Err(_) => requester_id.to_string(),
        };

        let new_friendship = NewFriendshipEntity {
            requester_id,
            receiver_id,
            status: "pending".to_string(),
        };

        let entity = self
            .repo
            .create(new_friendship)
            .await
            .map_err(|e| anyhow!(e))?;

        // Notify receiver
        let content = format!("User {} sent you a friend request", requester_name);
        let _ = self
            .notification_use_case
            .save_notification(receiver_id, "friend_request", &content, Some(requester_id))
            .await;

        self.ws_manager
            .notify_user(
                receiver_id,
                WSMessage {
                    msg_type: "notification".to_string(),
                    data: json!({
                        "type": "friend_request",
                        "requester_id": requester_id,
                        "requester_name": requester_name,
                        "content": content
                    }),
                },
            )
            .await;

        Ok(entity)
    }

    pub async fn accept_request(&self, user_id: i32, request_id: i32) -> Result<FriendshipEntity> {
        let friendship = self
            .repo
            .find_by_id(request_id)
            .await
            .map_err(|e| anyhow!(e))?
            .ok_or_else(|| anyhow!("Friend request not found"))?;

        if friendship.receiver_id != user_id {
            return Err(anyhow!("You are not the receiver of this request"));
        }

        let updated = self
            .repo
            .update_status(request_id, "accepted")
            .await
            .map_err(|e| anyhow!(e))?;

        // Fetch current user name
        let user_name = match self.brawler_repo.find_by_id(user_id).await {
            Ok(u) => u.display_name,
            Err(_) => user_id.to_string(),
        };

        // Notify requester
        let content = format!("User {} accepted your friend request", user_name);
        let _ = self
            .notification_use_case
            .save_notification(
                friendship.requester_id,
                "friend_accepted",
                &content,
                Some(user_id),
            )
            .await;

        self.ws_manager
            .notify_user(
                friendship.requester_id,
                WSMessage {
                    msg_type: "notification".to_string(),
                    data: json!({
                        "type": "friend_accepted",
                        "friend_id": user_id,
                        "content": content
                    }),
                },
            )
            .await;

        Ok(updated)
    }

    pub async fn reject_request(&self, user_id: i32, request_id: i32) -> Result<()> {
        let friendship = self
            .repo
            .find_by_id(request_id)
            .await
            .map_err(|e| anyhow!(e))?
            .ok_or_else(|| anyhow!("Friend request not found"))?;

        if friendship.receiver_id != user_id {
            return Err(anyhow!("You are not the receiver of this request"));
        }

        self.repo.delete(request_id).await.map_err(|e| anyhow!(e))?;

        Ok(())
    }

    pub async fn remove_friend(&self, user_id: i32, friend_id: i32) -> Result<()> {
        let friendship = self
            .repo
            .find_by_users(user_id, friend_id)
            .await
            .map_err(|e| anyhow!(e))?
            .ok_or_else(|| anyhow!("Friendship not found"))?;

        self.repo
            .delete(friendship.id)
            .await
            .map_err(|e| anyhow!(e))?;

        Ok(())
    }

    pub async fn list_pending(&self, user_id: i32) -> Result<Vec<PendingRequestDto>> {
        self.repo
            .list_pending_requests(user_id)
            .await
            .map_err(|e| anyhow!(e))
    }

    pub async fn list_friends(&self, user_id: i32) -> Result<Vec<i32>> {
        self.repo
            .list_friends(user_id)
            .await
            .map_err(|e| anyhow!(e))
    }

    pub async fn get_friendship_status(
        &self,
        user1_id: i32,
        user2_id: i32,
    ) -> Result<Option<String>> {
        let f = self
            .repo
            .find_by_users(user1_id, user2_id)
            .await
            .map_err(|e| anyhow!(e))?;
        Ok(f.map(|e| e.status))
    }
}
