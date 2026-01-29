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

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = MissionCommentPostgres::new(Arc::clone(&db_pool));
    let mission_viewing_repository = MissionViewingPostgres::new(db_pool);
    let use_case =
        MissionCommentUseCase::new(Arc::new(repository), Arc::new(mission_viewing_repository));

    Router::new()
        .route("/{mission_id}", get(get_comments))
        .route("/{mission_id}", post(add_comment))
        .route("/{mission_id}", delete(clear_comments))
        .route_layer(middleware::from_fn(auth))
        .with_state(Arc::new(use_case))
}

async fn get_comments(
    State(use_case): State<
        Arc<MissionCommentUseCase<MissionCommentPostgres, MissionViewingPostgres>>,
    >,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match use_case.get_comments(mission_id).await {
        Ok(comments) => (StatusCode::OK, Json(comments)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn add_comment(
    State(use_case): State<
        Arc<MissionCommentUseCase<MissionCommentPostgres, MissionViewingPostgres>>,
    >,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(payload): Json<AddMissionCommentModel>,
) -> impl IntoResponse {
    match use_case
        .add_comment(mission_id, user_id, &payload.content)
        .await
    {
        Ok(_) => (StatusCode::CREATED, "Comment added").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn clear_comments(
    State(use_case): State<
        Arc<MissionCommentUseCase<MissionCommentPostgres, MissionViewingPostgres>>,
    >,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    match use_case.clear_comments(mission_id, user_id).await {
        Ok(_) => (StatusCode::OK, "Chat cleared").into_response(),
        Err(e) => (StatusCode::FORBIDDEN, e.to_string()).into_response(),
    }
}
