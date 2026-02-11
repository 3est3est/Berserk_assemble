use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{get, patch, post},
};
use std::sync::Arc;

use crate::{
    application::use_cases::{friendships::FriendshipUseCase, notifications::NotificationUseCase},
    domain::repositories::brawlers::BrawlerRepository,
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                brawlers::BrawlerPostgres, friendships::FriendshipPostgres,
                notifications::NotificationPostgres,
            },
        },
        http::middlewares::auth::auth,
        websocket::manager::ConnectionManager,
    },
};

pub struct FriendshipRouterState {
    pub use_case: FriendshipUseCase,
    pub brawler_repo: Arc<dyn BrawlerRepository + Send + Sync>,
    pub ws_manager: Arc<ConnectionManager>,
}

pub async fn send_request(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(receiver_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.send_request(user_id, receiver_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn accept_request(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(request_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.accept_request(user_id, request_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn reject_request(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(request_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.reject_request(user_id, request_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn delete_friend(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(friend_id): Path<i32>,
) -> impl IntoResponse {
    match state.use_case.remove_friend(user_id, friend_id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_pending(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
) -> Json<serde_json::Value> {
    match state.use_case.list_pending(user_id).await {
        Ok(requests) => Json(serde_json::json!(requests)),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

pub async fn get_online_users(
    State(state): State<Arc<FriendshipRouterState>>,
) -> Json<serde_json::Value> {
    let online_ids = state.ws_manager.get_online_users().await;
    match state.brawler_repo.find_many(online_ids).await {
        Ok(users) => Json(serde_json::json!(users)),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

pub async fn get_status(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
    Path(other_id): Path<i32>,
) -> Json<serde_json::Value> {
    match state
        .use_case
        .get_friendship_status(user_id, other_id)
        .await
    {
        Ok(status) => Json(serde_json::json!({ "status": status })),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

pub async fn get_friends(
    State(state): State<Arc<FriendshipRouterState>>,
    Extension(user_id): Extension<i32>,
) -> Json<serde_json::Value> {
    match state.use_case.list_friends(user_id).await {
        Ok(friend_ids) => match state.brawler_repo.find_many(friend_ids).await {
            Ok(users) => Json(serde_json::json!(users)),
            Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
        },
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    let friendship_repo = Arc::new(FriendshipPostgres::new(Arc::clone(&db_pool)));
    let notification_repo = Arc::new(NotificationPostgres::new(Arc::clone(&db_pool)));
    let brawler_repo = Arc::new(BrawlerPostgres::new(Arc::clone(&db_pool)));

    let notification_use_case = Arc::new(NotificationUseCase::new(notification_repo));

    let use_case = FriendshipUseCase::new(
        friendship_repo,
        Arc::clone(&brawler_repo) as Arc<dyn BrawlerRepository + Send + Sync>,
        notification_use_case,
        Arc::clone(&manager),
    );

    let state = Arc::new(FriendshipRouterState {
        use_case,
        brawler_repo,
        ws_manager: manager,
    });

    Router::new()
        .route("/", get(get_friends))
        .route("/request/{receiver_id}", post(send_request))
        .route("/accept/{request_id}", patch(accept_request))
        .route(
            "/reject/{request_id}",
            axum::routing::delete(reject_request),
        )
        .route("/pending", get(get_pending))
        .route("/online", get(get_online_users))
        .route("/status/{other_id}", get(get_status))
        .route("/{friend_id}", axum::routing::delete(delete_friend))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}
