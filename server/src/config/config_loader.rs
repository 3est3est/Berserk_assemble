use std::env;

use anyhow::Result;

use crate::config::{
    config_model::{CloudinaryEnv, Database, DotEnvyConfig, JwtEnv, Server},
    stage::Stage,
};

pub fn load() -> Result<DotEnvyConfig> {
    dotenvy::dotenv().ok();

    let server = Server {
        port: std::env::var("SERVER_PORT")
            .expect("SERVER_PORT is valid")
            .parse()?,
        body_limit: std::env::var("SERVER_BODY_LIMIT")
            .expect("SERVER_BODY_LIMIT is valid")
            .parse()?,
        timeout: std::env::var("SERVER_TIMEOUT")
            .expect("SERVER_TIMEOUT is valid")
            .parse()?,
    };

    let database = Database {
        url: std::env::var("DATABASE_URL")
            .expect("DATABASE_URL is valid")
            .parse()?,
    };

    let secret = std::env::var("JWT_USER_SECRET")
        .expect("SECRET is valid")
        .parse()?;

    let refresh_secret = std::env::var("JWT_REFRESH_SECRET")
        .expect("REFRESH_SECRET is valid")
        .parse()?;

    let config = DotEnvyConfig {
        server,
        database,
        secret,
        refresh_secret,
        ttl: 3600, // Default TTL or fetch from env if needed
    };

    Ok(config)
}

pub fn get_user_secret_env() -> Result<DotEnvyConfig> {
    // load() // old
    let dot_env = match load() {
        Ok(dot_env) => dot_env,
        Err(e) => return Err(e),
    };

    Ok(dot_env)
}

pub fn get_jwt_env() -> Result<JwtEnv> {
    dotenvy::dotenv().ok();

    Ok(JwtEnv {
        secret: std::env::var("JWT_USER_SECRET")?,
        lift_time_days: std::env::var("JTW_LIFTTIME_DAYS")?.parse::<i64>()?,
    })
}

pub fn get_stage() -> Stage {
    dotenvy::dotenv().ok();

    let stage_str = std::env::var("STAGE").unwrap_or("".to_string());
    Stage::try_form(&stage_str).unwrap_or_default()
}

pub fn get_cloudinary_env() -> Result<CloudinaryEnv> {
    dotenvy::dotenv().ok();

    let cloud_name = std::env::var("CLOUDINARY_CLOUD_NAME")?;
    let api_key = std::env::var("CLOUDINARY_API_KEY")?;
    let api_secret = std::env::var("CLOUDINARY_API_SECRET")?;

    Ok(CloudinaryEnv {
        cloud_name,
        api_key,
        api_secret,
    })
}