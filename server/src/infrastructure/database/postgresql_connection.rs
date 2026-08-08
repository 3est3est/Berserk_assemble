use std::time::Duration;

use anyhow::Result;
use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

pub type PgPoolSquad = Pool<ConnectionManager<PgConnection>>;

pub fn establish_connection(database_url: &str) -> Result<PgPoolSquad> {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    let pool = Pool::builder()
        .max_size(5)
        .min_idle(Some(0))
        .connection_timeout(Duration::from_secs(10))
        .build(manager)?;
    Ok(pool)
}
