use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post},
};

use crate::{
    application::use_cases::crew_operation::CrewOperationUseCase,
    domain::{
        entities::notifications::AddNotificationEntity,
        repositories::{
            crew_operation::CrewOperationRepository, mission_viewing::MissionViewingRepository,
            notifications::NotificationRepository,
        },
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                crew_operation::CrewOperationPostgres, mission_viewing::MissionViewingPostgres,
                notifications::NotificationPostgres,
            },
        },
        http::middlewares::auth::auth,
        websocket::{handler::WSMessage, manager::ConnectionManager},
    },
};

pub struct CrewState<T1, T2>
where
    T1: CrewOperationRepository + Send + Sync,
    T2: MissionViewingRepository + Send + Sync,
{
    pub use_case: CrewOperationUseCase<T1, T2>,
    pub manager: Arc<ConnectionManager>,
    pub viewing_repository: Arc<T2>,
    pub notification_repo: Arc<dyn NotificationRepository>,
}

pub async fn join<T1, T2>(
    State(state): State<Arc<CrewState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.join(mission_id, user_id).await {
        Ok(_) => {
            if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                let ws_msg = WSMessage {
                    msg_type: "new_crew_joined".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                        "brawler_id": user_id
                    }),
                };

                // 1. Notify EVERYONE (for public list real-time update)
                state.manager.broadcast_all(ws_msg.clone()).await;

                // 2. Broadcast to the specific room (for in-room UI update)
                state.manager.broadcast(mission_id, ws_msg.clone()).await;

                // 3. Notify the CHIEF globally and save to DB
                let _ = state
                    .notification_repo
                    .add(AddNotificationEntity {
                        brawler_id: mission.chief_id,
                        type_: "new_crew_joined".to_string(),
                        content: format!("A new crew member joined your mission: {}", mission.name),
                        related_id: Some(mission_id),
                    })
                    .await;
                state.manager.notify_user(mission.chief_id, ws_msg).await;
            }
            (
                StatusCode::OK,
                format!("Join Mission_id:{} completed", mission_id),
            )
                .into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn leave<T1, T2>(
    State(state): State<Arc<CrewState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.leave(mission_id, user_id).await {
        Ok(_) => {
            if let Ok(mission) = state.viewing_repository.get_one(mission_id).await {
                let ws_msg = WSMessage {
                    msg_type: "crew_left".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                        "brawler_id": user_id
                    }),
                };

                // 1. Notify EVERYONE (for public list real-time update)
                state.manager.broadcast_all(ws_msg.clone()).await;

                // 2. Broadcast to the specific room (for in-room UI update)
                state.manager.broadcast(mission_id, ws_msg.clone()).await;

                // 3. PERSIST FOR CHIEF
                let _ = state
                    .notification_repo
                    .add(AddNotificationEntity {
                        brawler_id: mission.chief_id,
                        type_: "crew_left".to_string(),
                        content: format!("A crew member left your mission: {}", mission.name),
                        related_id: Some(mission_id),
                    })
                    .await;
                state.manager.notify_user(mission.chief_id, ws_msg).await;
            }
            (
                StatusCode::OK,
                format!("Leave Mission_id:{} completed", mission_id),
            )
                .into_response()
        }

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

/// ดึงรายการภารกิจที่ผู้ใช้เข้าร่วมอยู่
pub async fn get_my_joined_missions<T1, T2>(
    State(state): State<Arc<CrewState<T1, T2>>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse
where
    T1: CrewOperationRepository + Send + Sync + 'static,
    T2: MissionViewingRepository + Send + Sync + 'static,
{
    match state.use_case.get_my_joined_missions(user_id).await {
        Ok(missions) => (StatusCode::OK, Json(missions)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    let crew_operation_repository = CrewOperationPostgres::new(Arc::clone(&db_pool));
    let viewing_repository = MissionViewingPostgres::new(Arc::clone(&db_pool));
    let viewing_repository_arc = Arc::new(viewing_repository);
    let notification_repo = Arc::new(NotificationPostgres::new(Arc::clone(&db_pool)));

    let use_case = CrewOperationUseCase::new(
        Arc::new(crew_operation_repository),
        Arc::clone(&viewing_repository_arc),
    );

    let state = Arc::new(CrewState {
        use_case,
        manager,
        viewing_repository: viewing_repository_arc,
        notification_repo,
    });

    Router::new()
        .route("/join/{mission_id}", post(join))
        .route("/leave/{mission_id}", delete(leave))
        .route("/my-missions", get(get_my_joined_missions))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}
