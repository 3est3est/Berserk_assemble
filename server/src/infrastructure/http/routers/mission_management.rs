use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, patch, post},
};

use crate::infrastructure::websocket::handler::WSMessage;
use crate::{
    application::use_cases::mission_management::MissionManagementUseCase,
    domain::{
        repositories::mission_viewing::MissionViewingRepository,
        value_objects::mission_model::{AddMissionModel, EditMissionModel},
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{
                mission_management::MissionManagementPostgres,
                mission_viewing::MissionViewingPostgres,
            },
        },
        http::middlewares::auth::auth,
        websocket::manager::ConnectionManager,
    },
};

pub struct MissionManagementState {
    pub use_case: MissionManagementUseCase<MissionManagementPostgres, MissionViewingPostgres>,
    pub manager: Arc<ConnectionManager>,
}

pub async fn add(
    State(state): State<Arc<MissionManagementState>>,
    Extension(user_id): Extension<i32>,
    Json(model): Json<AddMissionModel>,
) -> impl IntoResponse {
    println!("DEBUG: Backend received payload: {:?}", model);
    match state.use_case.add(user_id, model).await {
        Ok(mission_id) => (StatusCode::CREATED, mission_id.to_string()).into_response(),

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn edit(
    State(state): State<Arc<MissionManagementState>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
    Json(model): Json<EditMissionModel>,
) -> impl IntoResponse {
    match state.use_case.edit(mission_id, user_id, model).await {
        Ok(mission_id) => (
            StatusCode::OK,
            format!("Edit mission_id: {} completed!!", mission_id),
        )
            .into_response(),

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn remove(
    State(state): State<Arc<MissionManagementState>>,
    Extension(user_id): Extension<i32>,
    Path(mission_id): Path<i32>,
) -> impl IntoResponse {
    // 1. Get mission info and crew before deletion (to know who to notify)
    let mission_info = state
        .use_case
        .mission_viewing_repository
        .get_one(mission_id)
        .await;
    let crew_info = state
        .use_case
        .mission_viewing_repository
        .get_crew(mission_id)
        .await;

    match state.use_case.remove(mission_id, user_id).await {
        Ok(_) => {
            if let (Ok(mission), Ok(crew)) = (mission_info, crew_info) {
                let ws_msg = WSMessage {
                    msg_type: "mission_deleted".to_string(),
                    data: serde_json::json!({
                        "mission_id": mission_id,
                        "mission_name": mission.name,
                    }),
                };

                tracing::info!(
                    "Mission {} deleted, notifying {} crew members and chief",
                    mission_id,
                    crew.len()
                );

                // Notify all crew members globally
                for member in crew {
                    if member.id != user_id {
                        // Don't notify the chief who deleted it
                        state.manager.notify_user(member.id, ws_msg.clone()).await;
                    }
                }

                // Broadcast to the room (for people currently in chat)
                state.manager.broadcast(mission_id, ws_msg).await;
            }

            (
                StatusCode::OK,
                format!("Remove mission_id: {} completed!!", mission_id),
            )
                .into_response()
        }

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub fn routes(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    let mission_repository = MissionManagementPostgres::new(Arc::clone(&db_pool));
    let viewing_repositiory = MissionViewingPostgres::new(Arc::clone(&db_pool));
    let use_case =
        MissionManagementUseCase::new(Arc::new(mission_repository), Arc::new(viewing_repositiory));

    let state = Arc::new(MissionManagementState { use_case, manager });

    Router::new()
        .route("/", post(add))
        .route("/{mission_id}", patch(edit))
        .route("/{mission_id}", delete(remove))
        .route_layer(middleware::from_fn(auth))
        .with_state(state)
}
