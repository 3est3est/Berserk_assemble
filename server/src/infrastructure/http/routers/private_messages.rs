use axum::{
    Extension, Json, Router,
    extract::State,
    response::IntoResponse,
    routing::{get, post},
};
use std::sync::Arc;

use crate::domain::entities::private_messages::CreatePrivateMessage;
use crate::domain::repositories::{
    notifications::NotificationRepository, private_messages::PrivateMessageRepository,
};
use crate::infrastructure::websocket::handler::WSMessage;
use crate::infrastructure::websocket::manager::ConnectionManager;

pub fn routes(
    pm_repo: Arc<dyn PrivateMessageRepository>,
    ws_manager: Arc<ConnectionManager>,
    notification_repo: Arc<dyn NotificationRepository>,
) -> Router {
    Router::new()
        .route("/", post(send_message))
        .route("/conversation/{with_id}", get(get_conversation))
        .route("/unread", get(get_unread_count))
        .route("/recent", get(get_recent_chats))
        .route("/read/{sender_id}", post(mark_as_read))
        .with_state((pm_repo, ws_manager, notification_repo))
}

async fn send_message(
    State((pm_repo, ws_manager, notification_repo)): State<(
        Arc<dyn PrivateMessageRepository>,
        Arc<ConnectionManager>,
        Arc<dyn NotificationRepository>,
    )>,
    Extension(user_id): Extension<i32>,
    Json(payload): Json<CreatePrivateMessage>,
) -> impl IntoResponse {
    match pm_repo
        .save(user_id, payload.receiver_id, payload.content)
        .await
    {
        Ok(msg) => {
            // 1. Create a notification for the receiver (so it shows in the bell)
            use crate::domain::entities::notifications::AddNotificationEntity;
            let sender_name = msg
                .sender_display_name
                .clone()
                .unwrap_or_else(|| "Agent".to_string());
            let _ = notification_repo
                .add(AddNotificationEntity {
                    brawler_id: msg.receiver_id,
                    type_: "private_message".to_string(),
                    content: format!("{}: \"{}\"", sender_name, msg.content),
                    related_id: Some(msg.sender_id),
                })
                .await;

            // 2. Send via WebSocket if recipient is online
            ws_manager
                .notify_user(
                    msg.receiver_id,
                    WSMessage {
                        msg_type: "private_message".to_string(),
                        data: serde_json::to_value(&msg).unwrap_or_default(),
                    },
                )
                .await;

            (axum::http::StatusCode::CREATED, Json(msg)).into_response()
        }
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_conversation(
    State((pm_repo, _, _)): State<(
        Arc<dyn PrivateMessageRepository>,
        Arc<ConnectionManager>,
        Arc<dyn NotificationRepository>,
    )>,
    Extension(user_id): Extension<i32>,
    axum::extract::Path(with_id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    match pm_repo.get_conversation(user_id, with_id).await {
        Ok(msgs) => Json(msgs).into_response(),
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_unread_count(
    State((pm_repo, _, _)): State<(
        Arc<dyn PrivateMessageRepository>,
        Arc<ConnectionManager>,
        Arc<dyn NotificationRepository>,
    )>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse {
    match pm_repo.get_unread_count(user_id).await {
        Ok(count) => Json(serde_json::json!({ "count": count })).into_response(),
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_recent_chats(
    State((pm_repo, _, _)): State<(
        Arc<dyn PrivateMessageRepository>,
        Arc<ConnectionManager>,
        Arc<dyn NotificationRepository>,
    )>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse {
    match pm_repo.get_recent_chats(user_id).await {
        Ok(chats) => Json(chats).into_response(),
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn mark_as_read(
    State((pm_repo, _, _)): State<(
        Arc<dyn PrivateMessageRepository>,
        Arc<ConnectionManager>,
        Arc<dyn NotificationRepository>,
    )>,
    Extension(user_id): Extension<i32>,
    axum::extract::Path(sender_id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    match pm_repo.mark_as_read(user_id, sender_id).await {
        Ok(_) => axum::http::StatusCode::OK.into_response(),
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
