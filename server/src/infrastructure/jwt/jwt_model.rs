use anyhow::Ok;
use anyhow::Result;
use chrono::Duration;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::config::config_loader::get_jwt_env;
use crate::infrastructure::jwt::generate_token;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Passport {
    pub id: i32,
    pub token: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub discord_id: Option<String>,
    pub contact_email: Option<String>,
    pub instagram: Option<String>,
    pub facebook: Option<String>,
}

impl Passport {
    pub fn new(
        user_id: i32,
        display_name: String,
        avatar_url: Option<String>,
        bio: Option<String>,
        discord_id: Option<String>,
        contact_email: Option<String>,
        instagram: Option<String>,
        facebook: Option<String>,
    ) -> Result<Self> {
        let jwt_env = get_jwt_env()?;
        let claims = Claims {
            sub: user_id.to_string(),
            exp: (Utc::now() + Duration::days(jwt_env.ttl)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
        };
        let token = generate_token(jwt_env.secret, &claims)?;
        Ok(Self {
            id: user_id,
            token,
            display_name,
            avatar_url,
            bio,
            discord_id,
            contact_email,
            instagram,
            facebook,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}
