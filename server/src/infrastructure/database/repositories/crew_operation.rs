use anyhow::{Ok, Result};
use async_trait::async_trait;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, insert_into};
use std::sync::Arc;

use crate::{
    domain::{
        entities::crew_memberships::CrewMemberShips,
        repositories::crew_operation::CrewOperationRepository,
        value_objects::{mission_model::MissionModel, mission_statuses::MissionStatuses},
    },
    infrastructure::database::{
        postgresql_connection::PgPoolSquad,
        schema::{crew_memberships, mission_comments, missions},
    },
};

pub struct CrewOperationPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl CrewOperationPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl CrewOperationRepository for CrewOperationPostgres {
    async fn join(&self, crew_member_ships: CrewMemberShips) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let mission_status: String = missions::table
            .select(missions::status)
            .filter(missions::id.eq(crew_member_ships.mission_id))
            .first(&mut conn)?;

        if mission_status != MissionStatuses::Open.to_string() {
            return Err(anyhow::anyhow!("Mission is not open for joining"));
        }

        insert_into(crew_memberships::table)
            .values(crew_member_ships)
            .execute(&mut conn)?;
        Ok(())
    }

    async fn leave(&self, crew_member_ships: CrewMemberShips) -> Result<()> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        // 1. Remove the membership
        diesel::delete(crew_memberships::table)
            .filter(crew_memberships::brawler_id.eq(crew_member_ships.brawler_id))
            .filter(crew_memberships::mission_id.eq(crew_member_ships.mission_id))
            .execute(&mut conn)?;

        // 2. Check if the mission is soft-deleted and has 0 members remaining
        use diesel::OptionalExtension;
        let mission_info: Option<(bool, i32)> = missions::table
            .select((missions::deleted_at.is_not_null(), missions::id))
            .filter(missions::id.eq(crew_member_ships.mission_id))
            .first::<(bool, i32)>(&mut conn)
            .optional()?;

        if let Some((is_deleted, mid)) = mission_info {
            if is_deleted {
                let count: i64 = crew_memberships::table
                    .filter(crew_memberships::mission_id.eq(mid))
                    .count()
                    .get_result(&mut conn)?;

                if count == 0 {
                    // 3. HARD DELETE: Last crew member left a deleted mission. Clean up DB.
                    diesel::delete(mission_comments::table)
                        .filter(mission_comments::mission_id.eq(mid))
                        .execute(&mut conn)?;

                    diesel::delete(missions::table)
                        .filter(missions::id.eq(mid))
                        .execute(&mut conn)?;
                }
            }
        }

        Ok(())
    }

    async fn get_my_joined_missions(&self, brawler_id: i32) -> Result<Vec<MissionModel>> {
        let sql = r#"
SELECT m.id,
       m.name,
       m.description,
       m.status,
       m.chief_id,
       COALESCE(b.display_name, '') AS chief_display_name,
       COALESCE(b.avatar_url, '') AS chief_avatar_url,
       (SELECT COUNT(*) FROM crew_memberships WHERE mission_id = m.id) AS crew_count,
       m.max_crew,
       m.created_at,
       m.updated_at,
       m.scheduled_at,
       m.location,
       m.deleted_at,
       m.category
FROM missions m
INNER JOIN crew_memberships cm ON cm.mission_id = m.id AND cm.brawler_id = $1
LEFT JOIN brawlers b ON b.id = m.chief_id
-- WHERE m.deleted_at IS NULL -- Allow seeing deleted missions so user can visit and leave
ORDER BY cm.joined_at DESC
        "#;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let rows = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .load::<MissionModel>(&mut conn)?;

        Ok(rows)
    }
}
