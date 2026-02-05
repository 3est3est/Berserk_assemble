use std::{net::SocketAddr, sync::Arc, time::Duration};

use anyhow::{Ok, Result};
use axum::{
    Router,
    http::{
        Method, StatusCode,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
};
use tokio::net::TcpListener;
use tower_http::{
    cors::{Any, CorsLayer},
    limit::RequestBodyLimitLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;

use crate::{
    config::config_model::DotEnvyConfig,
    infrastructure::{database::postgresql_connection::PgPoolSquad, http::routers},
    websocket::{handler::ws_handler, manager::ConnectionManager},
};

fn static_serve() -> Router {
    let dir = "statics";

    let service = ServeDir::new(dir).not_found_service(ServeFile::new(format!("{dir}/index.html")));

    Router::new().fallback_service(service)
}

fn api_serve(db_pool: Arc<PgPoolSquad>, manager: Arc<ConnectionManager>) -> Router {
    // Shared state specifically for the WebSocket handler
    let ws_router = Router::new()
        .route("/mission/{id}", axum::routing::get(ws_handler))
        .with_state(Arc::clone(&manager));

    Router::new()
        .nest("/brawler", routers::brawlers::routes(Arc::clone(&db_pool)))
        .nest(
            "/view",
            routers::mission_viewing::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/mission",
            routers::mission_operation::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/crew",
            routers::crew_operation::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/mission-management",
            routers::mission_management::routes(Arc::clone(&db_pool)),
        )
        .nest(
            "/authentication",
            routers::authentication::routes(Arc::clone(&db_pool)),
        )
        .nest("/util", routers::default_router::routes())
        .nest(
            "/comment",
            routers::mission_comment::routes(Arc::clone(&db_pool), Arc::clone(&manager)),
        )
        .nest("/ws", ws_router)
        .fallback(|| async { (StatusCode::NOT_FOUND, "API not found") })
}

pub async fn start(config: Arc<DotEnvyConfig>, db_pool: Arc<PgPoolSquad>) -> Result<()> {
    let manager = Arc::new(ConnectionManager::new());

    let app = Router::new()
        .merge(static_serve())
        .nest("/api", api_serve(db_pool, manager))
        .layer(tower_http::timeout::TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(config.server.timeout),
        ))
        .layer(RequestBodyLimitLayer::new(
            (config.server.body_limit * 1024 * 1024).try_into()?,
        ))
        .layer(
            CorsLayer::new()
                .allow_methods([
                    Method::GET,
                    Method::POST,
                    Method::PUT,
                    Method::PATCH,
                    Method::DELETE,
                    Method::OPTIONS,
                ])
                .allow_origin(Any)
                .allow_headers([AUTHORIZATION, CONTENT_TYPE]),
        )
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    let listener = TcpListener::bind(addr).await?;

    info!("Server start on port {}", config.server.port);
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async { tokio::signal::ctrl_c().await.expect("Fail ctrl + c") };

    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => info!("Receive ctrl + c signal"),
        _ = terminate => info!("Receive terminate signal"),
    }
}
