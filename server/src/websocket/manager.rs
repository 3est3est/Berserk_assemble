use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{RwLock, broadcast};

use super::handler::WSMessage;

/// Manages WebSocket connections and broadcasts for each mission
#[derive(Clone)]
pub struct ConnectionManager {
    /// Map of mission_id -> broadcast channel
    channels: Arc<RwLock<HashMap<i32, broadcast::Sender<WSMessage>>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Subscribe to a mission's broadcast channel
    pub async fn subscribe(&self, mission_id: i32) -> broadcast::Receiver<WSMessage> {
        let mut channels = self.channels.write().await;

        // Get or create channel for this mission
        let sender = channels
            .entry(mission_id)
            .or_insert_with(|| {
                // Create a channel with buffer size of 100 messages
                let (tx, _rx) = broadcast::channel(100);
                tx
            })
            .clone();

        sender.subscribe()
    }

    /// Unsubscribe from a mission (cleanup if no more subscribers)
    pub async fn unsubscribe(&self, mission_id: i32) {
        let mut channels = self.channels.write().await;

        // Remove channel if no more subscribers
        if let Some(sender) = channels.get(&mission_id) {
            if sender.receiver_count() == 0 {
                channels.remove(&mission_id);
            }
        }
    }

    /// Broadcast a message to all subscribers of a mission
    pub async fn broadcast(&self, mission_id: i32, message: WSMessage) {
        let channels = self.channels.read().await;

        if let Some(sender) = channels.get(&mission_id) {
            // Ignore error if no receivers (they'll be cleaned up later)
            let _ = sender.send(message);
        }
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
 