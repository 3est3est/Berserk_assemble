use crate::{
    domain::{
        repositories::mission_comment::MissionCommentRepository,
        value_objects::mission_comment_model::MissionCommentModel,
    },
    infrastructure::database::postgresql_connection::PgPoolSquad,
};
use anyhow::Result;
use async_trait::async_trait;
use diesel::RunQueryDsl;
use std::sync::Arc;

pub struct MissionCommentPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl MissionCommentPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl MissionCommentRepository for MissionCommentPostgres {
    async fn add(
        &self,
        mission_id: i32,
        brawler_id: i32,
        content: &str,
    ) -> Result<MissionCommentModel> {
        use crate::infrastructure::database::schema::mission_comments;
        use diesel::ExpressionMethods;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let inserted_id: i32 = diesel::insert_into(mission_comments::table)
            .values((
                mission_comments::mission_id.eq(mission_id),
                mission_comments::brawler_id.eq(brawler_id),
                mission_comments::content.eq(content),
            ))
            .returning(mission_comments::id)
            .get_result(&mut conn)?;

        let sql = r#"
            SELECT c.id, c.mission_id, c.brawler_id, 
                   b.display_name as brawler_display_name,
                   COALESCE(b.avatar_url, '') as brawler_avatar_url,
                   c.content, c.created_at
            FROM mission_comments c
            JOIN brawlers b ON b.id = c.brawler_id
            WHERE c.id = $1
        "#;

        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(inserted_id)
            .get_result::<MissionCommentModel>(&mut conn)?;

        Ok(result)
    }

    async fn get_by_mission_id(&self, mission_id: i32) -> Result<Vec<MissionCommentModel>> {
        let sql = r#"
            SELECT c.id, c.mission_id, c.brawler_id, 
                   b.display_name as brawler_display_name,
                   COALESCE(b.avatar_url, '') as brawler_avatar_url,
                   c.content, c.created_at
            FROM mission_comments c
            JOIN brawlers b ON b.id = c.brawler_id
            WHERE c.mission_id = $1
            ORDER BY c.created_at ASC
        "#;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let comments = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .load::<MissionCommentModel>(&mut conn)?;
        Ok(comments)
    }

    async fn clear_by_mission_id(&self, mission_id: i32) -> Result<()> {
        use crate::infrastructure::database::schema::mission_comments;
        use diesel::ExpressionMethods;
        use diesel::QueryDsl;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        diesel::delete(mission_comments::table.filter(mission_comments::mission_id.eq(mission_id)))
            .execute(&mut conn)?;
        Ok(())
    }
}
