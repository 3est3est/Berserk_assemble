#[derive(Debug, Clone)]
pub struct Server {
    pub port: u16,
    pub body_limit: u64,
    pub timeout: u64,
}

#[derive(Debug, Clone)]
pub struct Database {
    pub url: String,
}

#[derive(Debug, Clone)]
pub struct JwtEnv {
    pub ttl: i64,
    pub secret: String,
}


#[derive(Debug, Clone)]
pub struct DotEnvyConfig {
    pub server: Server,
    pub database: Database,
    pub secret: String,
    // pub max_crew_per_mission: u32,
}
#[derive(Debug, Clone)]
pub struct CloudinaryEnv {
    pub cloud_name: String,
    pub api_key: String,
    pub secret: String,
    pub api_secret: String,
}


