use crate::{
    domain::{
        entities::notifications::{AddNotificationEntity, NotificationEntity},
        repositories::notifications::NotificationRepository,
    },
    infrastructure::database::postgresql_connection::PgPoolSquad,
};
use anyhow::Result;
use async_trait::async_trait;
use diesel::{BoolExpressionMethods, ExpressionMethods, QueryDsl, RunQueryDsl};
use std::sync::Arc;

pub struct NotificationPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl NotificationPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl NotificationRepository for NotificationPostgres {
    async fn add(&self, notification: AddNotificationEntity) -> Result<NotificationEntity> {
        use crate::infrastructure::database::schema::notifications;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let result = diesel::insert_into(notifications::table)
            .values((
                notifications::brawler_id.eq(notification.brawler_id),
                notifications::type_.eq(notification.type_),
                notifications::content.eq(notification.content),
                notifications::related_id.eq(notification.related_id),
            ))
            .get_result(&mut conn)?;

        Ok(result)
    }

    async fn get_by_user(&self, user_id: i32) -> Result<Vec<NotificationEntity>> {
        use crate::infrastructure::database::schema::notifications;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let results = notifications::table
            .filter(notifications::brawler_id.eq(user_id))
            .order(notifications::created_at.desc())
            .limit(50)
            .load::<NotificationEntity>(&mut conn)?;

        Ok(results)
    }

    async fn mark_as_read(&self, notification_id: i32, user_id: i32) -> Result<()> {
        use crate::infrastructure::database::schema::notifications;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        diesel::update(
            notifications::table.filter(
                notifications::id
                    .eq(notification_id)
                    .and(notifications::brawler_id.eq(user_id)),
            ),
        )
        .set(notifications::is_read.eq(true))
        .execute(&mut conn)?;

        Ok(())
    }

    async fn mark_all_as_read(&self, user_id: i32) -> Result<()> {
        use crate::infrastructure::database::schema::notifications;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        diesel::update(notifications::table.filter(notifications::brawler_id.eq(user_id)))
            .set(notifications::is_read.eq(true))
            .execute(&mut conn)?;

        Ok(())
    }

    async fn delete_for_user(&self, user_id: i32) -> Result<()> {
        use crate::infrastructure::database::schema::notifications;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        diesel::delete(notifications::table.filter(notifications::brawler_id.eq(user_id)))
            .execute(&mut conn)?;

        Ok(())
    }
}
