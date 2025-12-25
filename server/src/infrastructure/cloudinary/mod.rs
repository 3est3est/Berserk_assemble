use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use diesel::{RunQueryDsl, SelectableHelper};
use std::sync::Arc;

use crate::domain::entities::brawlers::{BrawlerEntity, RegisterBrawlerEntity};
use crate::domain::repositories::brawlers::BrawlerRepository;
use crate::domain::value_objects::uploaded_img::{UploadBase64Img, UploadedImg};
use crate::infrastructure::cloudinary;
use crate::infrastructure::database::postgresql_connection::PgPoolSquad;
use crate::infrastructure::database::schema::brawlers;

pub struct BrawlerPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl BrawlerPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl BrawlerRepository for BrawlerPostgres {
    async fn register(&self, register_brawler_entity: RegisterBrawlerEntity) -> Result<i32> {
        let mut connection = self
            .db_pool
            .get()
            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

        let result = diesel::insert_into(brawlers::table)
            .values(&register_brawler_entity)
            .returning(brawlers::id)
            .get_result::<i32>(&mut connection)?;

        Ok(result)
    }

    async fn find_by_username(&self, username: String) -> Result<BrawlerEntity> {
        let mut connection = self
            .db_pool
            .get()
            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

        let result = brawlers::table
            .filter(brawlers::username.eq(username))
            .select(BrawlerEntity::as_select())
            .first::<BrawlerEntity>(&mut connection)?;

        Ok(result)
    }

    async fn upload_base64img(
        &self,
        user_id: i32,
        base64_img: UploadBase64Img,
    ) -> Result<UploadedImg> {
        let mut connection = self
            .db_pool
            .get()
            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

        let opt = cloudinary::UploadImageOptions {
            folder: Some("avatars".to_string()),
            public_id: Some(format!("avatar_{}", user_id)),
            transformation: None,
        };

        let uploaded_img = cloudinary::upload(base64_img, opt).await?;

        diesel::update(brawlers::table.filter(brawlers::id.eq(user_id)))
            .set((
                brawlers::avatar_url.eq(Some(uploaded_img.url.clone())),
                brawlers::avatar_public_id.eq(Some(uploaded_img.public_id.clone())),
            ))
            .execute(&mut connection)?;

        Ok(uploaded_img)
    }
}
