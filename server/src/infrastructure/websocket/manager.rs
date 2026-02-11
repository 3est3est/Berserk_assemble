use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};

use super::handler::WSMessage;

/// Manages WebSocket connections and broadcasts for each mission and user
#[derive(Clone)]
pub struct ConnectionManager {
    /// Map of mission_id -> broadcast channel
    channels: Arc<RwLock<HashMap<i32, broadcast::Sender<WSMessage>>>>,
    /// Map of user_id -> broadcast channel (for global notifications)
    user_channels: Arc<RwLock<HashMap<i32, broadcast::Sender<WSMessage>>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
            user_channels: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Subscribe to a mission's broadcast channel
    pub async fn subscribe(&self, mission_id: i32) -> broadcast::Receiver<WSMessage> {
        let mut channels = self.channels.write().await;

        let sender = channels
            .entry(mission_id)
            .or_insert_with(|| {
                let (tx, _rx) = broadcast::channel(100);
                tx
            })
            .clone();

        sender.subscribe()
    }

    /// Unsubscribe from a mission
    pub async fn unsubscribe(&self, mission_id: i32) {
        let mut channels = self.channels.write().await;

        if let Some(sender) = channels.get(&mission_id) {
            if sender.receiver_count() == 0 {
                channels.remove(&mission_id);
            }
        }
    }

    /// Broadcast to all subscribers of a mission
    pub async fn broadcast(&self, mission_id: i32, message: WSMessage) {
        let channels = self.channels.read().await;

        if let Some(sender) = channels.get(&mission_id) {
            let _ = sender.send(message);
        }
    }

    /// Subscribe to a user's global notification channel
    pub async fn subscribe_user(&self, user_id: i32) -> broadcast::Receiver<WSMessage> {
        let mut user_channels = self.user_channels.write().await;

        let sender = user_channels
            .entry(user_id)
            .or_insert_with(|| {
                let (tx, _rx) = broadcast::channel(100);
                tx
            })
            .clone();

        sender.subscribe()
    }

    /// Unsubscribe from a user's global notification channel
    pub async fn unsubscribe_user(&self, user_id: i32) {
        let mut user_channels = self.user_channels.write().await;

        if let Some(sender) = user_channels.get(&user_id) {
            if sender.receiver_count() == 0 {
                user_channels.remove(&user_id);
            }
        }
    }

    /// Notify a specific user
    pub async fn notify_user(&self, user_id: i32, message: WSMessage) {
        let user_channels = self.user_channels.read().await;

        if let Some(sender) = user_channels.get(&user_id) {
            let _ = sender.send(message);
        }
    }

    /// Broadcast to EVERY user's global notification channel
    pub async fn broadcast_all(&self, message: WSMessage) {
        let user_channels = self.user_channels.read().await;

        for sender in user_channels.values() {
            let _ = sender.send(message.clone());
        }
    }

    pub async fn get_online_users(&self) -> Vec<i32> {
        let user_channels = self.user_channels.read().await;
        user_channels.keys().copied().collect()
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
