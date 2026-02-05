use crate::{
    application::use_cases::mission_comment::MissionCommentUseCase,
    domain::value_objects::mission_comment_model::AddMissionCommentModel,
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                mission_comment::MissionCommentPostgres, mission_viewing::MissionViewingPostgres,
            },
        },
        http::middlewares::auth::auth,
    },
    websocket::{handler::WSMessage, manager::ConnectionManager},
};
use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post},
};
use std::sync::Arc;

pub struct CommentState {
    pub use_case: MissionCommentUseCase<MissionCommentPostgres, MissionViewingPostgres>,
    pub manager: Arc<ConnectionManager>,
}

pub fn routes(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    let repository = MissionCommentPostgres::new(Arc::clone(&db_pool));
    let mission_viewing_repository = MissionViewingPostgres::new(db_pool);
    let use_case =
        MissionCommentUseCase::new(Arc::new(repository), Arc::new(mission_viewing_repository));

    let state = Arc::new(CommentState { use_case, manager });

    Router::new()
        .route("/{mission_id}", get(get_comments))
        .route("/{mission_id}", post(add_comment))
        .route("/{mission_id}", delete(clear_comments))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}

async fn get_comments(
    State(state): State<Arc<CommentState>>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.get_comments(mission_id).await {
        Ok(comments) => (StatusCode::OK, Json(comments)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn add_comment(
    State(state): State<Arc<CommentState>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(payload): Json<AddMissionCommentModel>,
) -> impl IntoResponse {
    match state
        .use_case
        .add_comment(mission_id, user_id, &payload.content)
        .await
    {
        Ok(comment) => {
            // BROADCAST NEW COMMENT VIA WEBSOCKET
            let ws_msg = WSMessage {
                msg_type: "new_comment".to_string(),
                data: serde_json::to_value(&comment).unwrap_or_default(),
            };
            state.manager.broadcast(mission_id, ws_msg).await;

            (StatusCode::CREATED, Json(comment)).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn clear_comments(
    State(state): State<Arc<CommentState>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.clear_comments(mission_id, user_id).await {
        Ok(_) => {
            // BROADCAST CLEAR VIA WEBSOCKET
            let ws_msg = WSMessage {
                msg_type: "clear_chat".to_string(),
                data: serde_json::json!({ "mission_id": mission_id }),
            };
            state.manager.broadcast(mission_id, ws_msg).await;

            (StatusCode::OK, "Chat cleared").into_response()
        }
        Err(e) => (StatusCode::FORBIDDEN, e.to_string()).into_response(),
    }
}
