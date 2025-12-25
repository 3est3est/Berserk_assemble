use anyhow::Result;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};

use crate::{config::config_loader::get_jwt_env, infrastructure::jwt::generate_token};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Passport {
    pub token_type: String,
    pub access_token: String,
    pub expires_in: usize,
}

impl Passport {
    pub fn new(brawler_id: i32) -> Result<Self> {
        let jwt_env = get_jwt_env()?;
        let token_type = "Bearer".to_string();
        let expires_in = (Utc::now() + Duration::days(jwt_env.lift_time_days)).timestamp() as usize;

        let access_token_claims = Claims {
            sub: brawler_id.to_string(),
            exp: expires_in,
            iat: Utc::now().timestamp() as usize,
        };
        let access_token = generate_token(jwt_env.secret, &access_token_claims)?;

        Ok(Self {
            token_type,
            access_token,
            expires_in,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

