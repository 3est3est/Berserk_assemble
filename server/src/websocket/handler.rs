use axum::{
    extract::{
        Path, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
// Connection manager is used below
use super::manager::ConnectionManager;
// WSMessage is used for WebSocket communication
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WSMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub data: serde_json::Value,
}

/// WebSocket handler for mission chat
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(mission_id): Path<i32>,
    State(manager): State<Arc<ConnectionManager>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, mission_id, manager))
}

async fn handle_socket(socket: WebSocket, mission_id: i32, manager: Arc<ConnectionManager>) {
    let (mut sender, mut receiver) = socket.split();
    // Subscribe to this mission's broadcast channel
    let mut rx = manager.subscribe(mission_id).await;
    // Spawn a task to forward broadcast messages to this WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json_msg = serde_json::to_string(&msg).unwrap_or_default();
            if sender.send(Message::Text(json_msg.into())).await.is_err() {
                break;
            }
        }
    });
    // Handle incoming messages from this WebSocket client
    let manager_clone = manager.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            if let Ok(Message::Text(text)) = msg {
                // Parse incoming message
                if let Ok(ws_msg) = serde_json::from_str::<WSMessage>(&text) {
                    // Handle different message types if needed
                    match ws_msg.msg_type.as_str() {
                        "ping" => {
                            // Respond to ping
                        }
                        _ => {}
                    }
                }
            }
        }
        manager_clone.unsubscribe(mission_id).await;
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
