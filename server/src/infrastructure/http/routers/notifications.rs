use crate::infrastructure::http::middlewares::auth::auth;
use crate::{
    domain::repositories::notifications::NotificationRepository,
    infrastructure::database::{
        postgresql_connection::PgPoolSquad, repositories::notifications::NotificationPostgres,
    },
};
use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, patch},
};
use std::sync::Arc;

pub struct NotificationRouterState {
    pub repo: Arc<dyn NotificationRepository>,
}

pub async fn get_my_notifications(
    State(state): State<Arc<NotificationRouterState>>,
    Extension(user_id): Extension<i32>,
) -> Json<serde_json::Value> {
    match state.repo.get_by_user(user_id).await {
        Ok(notifications) => Json(serde_json::json!(notifications)),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

pub async fn mark_as_read(
    State(state): State<Arc<NotificationRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    match state.repo.mark_as_read(id, user_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn mark_all_as_read(
    State(state): State<Arc<NotificationRouterState>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse {
    match state.repo.mark_all_as_read(user_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn clear_notifications(
    State(state): State<Arc<NotificationRouterState>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse {
    match state.repo.delete_for_user(user_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repo = Arc::new(NotificationPostgres::new(db_pool));
    let state = Arc::new(NotificationRouterState { repo });

    Router::new()
        .route("/", get(get_my_notifications))
        .route("/mark-all-read", patch(mark_all_as_read))
        .route("/{id}/read", patch(mark_as_read))
        .route("/", delete(clear_notifications))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}
