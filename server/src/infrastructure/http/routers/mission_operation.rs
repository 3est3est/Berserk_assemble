use std::sync::Arc;

use axum::{
    Extension, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::patch,
};

use crate::{
    application::use_cases::mission_operation::MissionOperationUseCase,
    domain::repositories::{
        mission_operation::MissionOperationRepository, mission_viewing::MissionViewingRepository,
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                mission_operation::MissionOperationPostgres,
                mission_viewing::MissionViewingPostgres,
            },
        },
        http::middlewares::auth::auth,
        websocket::{handler::WSMessage, manager::ConnectionManager},
    },
};

pub struct MissionOperationState<T1, T2>
where
    T1: MissionOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
{
    pub use_case: MissionOperationUseCase<T1, T2>,
    pub manager: Arc<ConnectionManager>,
    pub viewing_repository: Arc<T2>,
}

pub async fn in_progress<T1, T2>(
    State(state): State<Arc<MissionOperationState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: MissionOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.in_progress(mission_id, user_id).await {
        Ok(_) => {
            // 1. Notify all crew members globally (for toast)
            if let Ok(crew) = state.viewing_repository.get_crew(mission_id).await {
                if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                    let ws_msg = WSMessage {
                        msg_type: "mission_started".to_string(),
                        data: serde_json::json!({
                            "mission_id": mission_id,
                            "mission_name": mission.name,
                            "new_status": "InProgress"
                        }),
                    };
                    for member in crew {
                        state.manager.notify_user(member.id, ws_msg.clone()).await;
                    }

                    // 2. Broadcast to EVERYONE (for public list/manager/dashboard real-time update)
                    state.manager.broadcast_all(ws_msg.clone()).await;

                    // 3. Broadcast to the specific room (for in-room UI update)
                    state.manager.broadcast(mission_id, ws_msg).await;
                }
            }
            (StatusCode::OK, mission_id.to_string()).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn to_completed<T1, T2>(
    State(state): State<Arc<MissionOperationState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: MissionOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.to_completed(mission_id, user_id).await {
        Ok(mission_id) => {
            // Broadcast completion to the room
            if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                let ws_msg = WSMessage {
                    msg_type: "mission_completed".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                        "new_status": "Completed"
                    }),
                };
                // 1. Broadcast to EVERYONE (Dashboard/Manager real-time update)
                state.manager.broadcast_all(ws_msg.clone()).await;

                // 2. Broadcast to the specific room (In-room UI update)
                state.manager.broadcast(mission_id, ws_msg).await;
            }
            (StatusCode::OK, mission_id.to_string()).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn to_failed<T1, T2>(
    State(state): State<Arc<MissionOperationState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: MissionOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.to_failed(mission_id, user_id).await {
        Ok(mission_id) => {
            // Broadcast failure to the room
            if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                let ws_msg = WSMessage {
                    msg_type: "mission_failed".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                        "new_status": "Failed"
                    }),
                };
                // 1. Broadcast to EVERYONE (Dashboard/Manager real-time update)
                state.manager.broadcast_all(ws_msg.clone()).await;

                // 2. Broadcast to the specific room (In-room UI update)
                state.manager.broadcast(mission_id, ws_msg).await;
            }
            (StatusCode::OK, mission_id.to_string()).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn kick<T1, T2>(
    State(state): State<Arc<MissionOperationState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path((mission_id, brawler_id)): Path<(i32, i32)>,
) -> impl IntoResponse
where
    T1: MissionOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.kick(mission_id, brawler_id, user_id).await {
        Ok(_) => {
            // Notify the kicked member and the room
            if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                let ws_msg = WSMessage {
                    msg_type: "kicked_from_mission".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                        "brawler_id": brawler_id, // Include brawler_id so frontend knows who was kicked
                    }),
                };

                // 1. Notify the kicked user globally (for toast)
                state.manager.notify_user(brawler_id, ws_msg.clone()).await;

                // 2. Broadcast to EVERYONE (for public list/manager real-time count update)
                state.manager.broadcast_all(ws_msg.clone()).await;

                // 3. Broadcast to the specific room (for in-room UI reaction)
                state.manager.broadcast(mission_id, ws_msg).await;
            }
            StatusCode::OK.into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    let mission_repository = MissionOperationPostgres::new(Arc::clone(&db_pool));
    let viewing_repository = MissionViewingPostgres::new(Arc::clone(&db_pool));
    let viewing_repository_arc = Arc::new(viewing_repository);

    let use_case = MissionOperationUseCase::new(
        Arc::new(mission_repository),
        Arc::clone(&viewing_repository_arc),
    );

    let state = Arc::new(MissionOperationState {
        use_case,
        manager,
        viewing_repository: viewing_repository_arc,
    });

    Router::new()
        .route("/in-progress/{mission_id}", patch(in_progress))
        .route("/to-completed/{mission_id}", patch(to_completed))
        .route("/to-failed/{mission_id}", patch(to_failed))
        .route("/kick/{mission_id}/{brawler_id}", patch(kick))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}
