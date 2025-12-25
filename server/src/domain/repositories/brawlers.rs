use crate::{
    domain::{
        entities::brawlers::{BrawlerEntity, RegisterBrawlerEntity},
        value_objects::{base64_img::Base64Img, uploaded_img::UploadedImg},
    },
    infrastructure::cloudinary::UploadImageOptions,
};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait BrawlerRepository {
    async fn register(&self, register_brawler_entity: RegisterBrawlerEntity) -> Result<i32>;
    async fn find_by_username(&self, username: String) -> Result<BrawlerEntity>;
    async fn upload_base64img(
        &self,
        user_id: i32,
        base64img: Base64Img,
        opt: UploadImageOptions,
    ) -> Result<UploadedImg>;
}
