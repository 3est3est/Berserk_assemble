use axum::{
    Extension,
    extract::{
        Path, State, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use super::manager::ConnectionManager;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WSMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub data: serde_json::Value,
}

/// WebSocket handler for mission chat (Room-based)
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(mission_id): Path<i32>,
    State(manager): State<Arc<ConnectionManager>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, mission_id, manager))
}

async fn handle_socket(socket: WebSocket, mission_id: i32, manager: Arc<ConnectionManager>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = manager.subscribe(mission_id).await;

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json_msg = serde_json::to_string(&msg).unwrap_or_default();
            if sender.send(Message::Text(json_msg.into())).await.is_err() {
                break;
            }
        }
    });

    let manager_clone = manager.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            if let Ok(Message::Text(text)) = msg {
                if let Ok(ws_msg) = serde_json::from_str::<WSMessage>(&text) {
                    match ws_msg.msg_type.as_str() {
                        "ping" => {}
                        _ => {}
                    }
                }
            }
        }
        manager_clone.unsubscribe(mission_id).await;
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

/// WebSocket handler for global notifications (User-based)
pub async fn global_ws_handler(
    ws: WebSocketUpgrade,
    Extension(user_id): Extension<i32>,
    State(manager): State<Arc<ConnectionManager>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_global_socket(socket, user_id, manager))
}

async fn handle_global_socket(socket: WebSocket, user_id: i32, manager: Arc<ConnectionManager>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = manager.subscribe_user(user_id).await;

    // Broadcast online status
    manager
        .broadcast_all(WSMessage {
            msg_type: "agent_online".to_string(),
            data: serde_json::json!({ "user_id": user_id }),
        })
        .await;

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json_msg = serde_json::to_string(&msg).unwrap_or_default();
            if sender.send(Message::Text(json_msg.into())).await.is_err() {
                break;
            }
        }
    });

    let manager_clone = manager.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(_) = receiver.next().await {
            // Keep connection alive, can handle client-to-server global msgs here
        }
        manager_clone.unsubscribe_user(user_id).await;

        // Broadcast offline status
        manager_clone
            .broadcast_all(WSMessage {
                msg_type: "agent_offline".to_string(),
                data: serde_json::json!({ "user_id": user_id }),
            })
            .await;
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
