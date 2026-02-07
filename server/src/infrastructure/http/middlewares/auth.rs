use axum::{
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::Response,
};

use crate::{config::config_loader::get_jwt_env, infrastructure::jwt::verify_token};

pub async fn auth(mut req: Request, next: Next) -> Result<Response, StatusCode> {
    tracing::debug!("Auth middleware called for: {}", req.uri());
    // 1. Try to get token from Authorization header
    let token_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    // 2. If not in header, try query parameter (for WebSockets)
    let token = if let Some(t) = token_header {
        t.to_string()
    } else {
        req.uri()
            .query()
            .and_then(|q| {
                q.split('&')
                    .find(|p| p.starts_with("token="))
                    .map(|p| p.trim_start_matches("token=").to_string())
            })
            .ok_or(StatusCode::UNAUTHORIZED)?
    };

    let jwt_env = get_jwt_env().unwrap();
    let secret = jwt_env.secret;

    let claims = verify_token(secret, token).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user_id = claims
        .sub
        .parse::<i32>()
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(user_id);

    Ok(next.run(req).await)
}
