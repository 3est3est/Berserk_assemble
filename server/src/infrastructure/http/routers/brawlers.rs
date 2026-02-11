use axum::{
    Extension, Json, Router,
    extract::{Path, State},
    http::StatusCode as AxumStatusCode,
    response::IntoResponse,
    routing::{get, patch, post},
};
use std::sync::Arc;

use crate::{
    application::use_cases::brawlers::BrawlersUseCase,
    domain::{
        repositories::brawlers::BrawlerRepository,
        value_objects::{
            brawler_model::{RegisterBrawlerModel, UpdateBrawlerModel},
            uploaded_img::UploadBase64Img,
        },
    },
    infrastructure::{
        database::{postgresql_connection::PgPoolSquad, repositories::brawlers::BrawlerPostgres},
        http::middlewares::auth::auth,
    },
};

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = BrawlerPostgres::new(db_pool);
    let user_case = BrawlersUseCase::new(Arc::new(repository));

    let protected_routes: Router<_> = Router::new()
        .route("/avatar", post(upload_avatar))
        .route("/my-missions", get(get_missions))
        .route("/profile", patch(update_profile))
        .route("/{id}", get(get_brawler_by_id))
        .route_layer(axum::middleware::from_fn(auth));

    Router::new()
        .merge(protected_routes)
        .route("/register", post(register))
        .with_state(Arc::new(user_case))
}

pub async fn register<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Json(model): Json<RegisterBrawlerModel>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.register(model).await {
        Ok(passport) => (AxumStatusCode::CREATED, Json(passport)).into_response(),

        Err(e) => {
            tracing::error!("Register error: {:?}", e);
            (AxumStatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
        }
    }
}

pub async fn upload_avatar<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
    Json(model): Json<UploadBase64Img>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case
        .upload_base64img(user_id, model.base64_string)
        .await
    {
        Ok(upload_img) => (AxumStatusCode::OK, Json(upload_img)).into_response(),

        Err(e) => (AxumStatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_missions<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.get_my_missions(user_id).await {
        Ok(missions) => (AxumStatusCode::OK, Json(missions)).into_response(),

        Err(e) => (AxumStatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn update_profile<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
    Json(model): Json<UpdateBrawlerModel>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.update_profile(user_id, model).await {
        Ok(passport) => (AxumStatusCode::OK, Json(passport)).into_response(),

        Err(e) => (AxumStatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_brawler_by_id<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Path(id): Path<i32>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.get_brawler_by_id(id).await {
        Ok(brawler) => (AxumStatusCode::OK, Json(brawler)).into_response(),
        Err(e) => (AxumStatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
