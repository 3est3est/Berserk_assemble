use crate::{
    domain::{
        entities::brawlers::{BrawlerEntity, RegisterBrawlerEntity},
        value_objects::{
            base64_img::Base64Img, brawler_model::UpdateBrawlerModel, mission_model::MissionModel,
            uploaded_img::UploadedImg,
        },
    },
    infrastructure::{cloudinary::UploadImageOptions, jwt::jwt_model::Passport},
};
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait BrawlerRepository {
    async fn register(&self, register_brawler_entity: RegisterBrawlerEntity) -> Result<Passport>;
    async fn find_by_id(&self, id: i32) -> Result<BrawlerEntity>;
    async fn find_by_username(&self, username: String) -> Result<BrawlerEntity>;
    async fn find_many(&self, ids: Vec<i32>) -> Result<Vec<BrawlerEntity>>;
    async fn upload_base64img(
        &self,
        user_id: i32,
        base64img: Base64Img,
        opt: UploadImageOptions,
    ) -> Result<UploadedImg>;
    async fn crew_counting(&self, mission_id: i32) -> Result<u32>;
    async fn get_missions(&self, brawler_id: i32) -> Result<Vec<MissionModel>>;
    async fn update_profile(&self, brawler_id: i32, model: UpdateBrawlerModel) -> Result<Passport>;
}
