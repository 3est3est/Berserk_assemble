use crate::domain::entities::private_messages::PrivateMessage;
use crate::domain::repositories::private_messages::PrivateMessageRepository;
use crate::infrastructure::database::schema::private_messages;
use async_trait::async_trait;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use std::sync::Arc;

pub struct PrivateMessagePostgres {
    pool: Arc<Pool<ConnectionManager<PgConnection>>>,
}

impl PrivateMessagePostgres {
    pub fn new(pool: Arc<Pool<ConnectionManager<PgConnection>>>) -> Self {
        Self { pool }
    }
}

#[derive(Queryable, Selectable, Insertable)]
#[diesel(table_name = private_messages)]
struct PrivateMessageDb {
    id: i32,
    sender_id: i32,
    receiver_id: i32,
    content: String,
    is_read: bool,
    created_at: chrono::NaiveDateTime,
}

#[derive(QueryableByName, Debug)]
struct RecentChatDb {
    #[diesel(sql_type = diesel::sql_types::Integer)]
    id: i32,
    #[diesel(sql_type = diesel::sql_types::Integer)]
    sender_id: i32,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    sender_name: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    sender_avatar_url: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Integer)]
    receiver_id: i32,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    receiver_name: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    receiver_avatar_url: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Text)]
    content: String,
    #[diesel(sql_type = diesel::sql_types::Bool)]
    is_read: bool,
    #[diesel(sql_type = diesel::sql_types::Timestamp)]
    created_at: chrono::NaiveDateTime,
}

impl From<PrivateMessageDb> for PrivateMessage {
    fn from(db: PrivateMessageDb) -> Self {
        Self {
            id: db.id,
            sender_id: db.sender_id,
            sender_display_name: None,
            sender_avatar_url: None,
            receiver_id: db.receiver_id,
            receiver_display_name: None,
            receiver_avatar_url: None,
            content: db.content,
            is_read: db.is_read,
            created_at: db.created_at,
        }
    }
}

impl From<RecentChatDb> for PrivateMessage {
    fn from(db: RecentChatDb) -> Self {
        Self {
            id: db.id,
            sender_id: db.sender_id,
            sender_display_name: db.sender_name,
            sender_avatar_url: db.sender_avatar_url,
            receiver_id: db.receiver_id,
            receiver_display_name: db.receiver_name,
            receiver_avatar_url: db.receiver_avatar_url,
            content: db.content,
            is_read: db.is_read,
            created_at: db.created_at,
        }
    }
}

#[async_trait]
impl PrivateMessageRepository for PrivateMessagePostgres {
    async fn save(&self, s_id: i32, r_id: i32, msg: String) -> Result<PrivateMessage, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let saved = diesel::insert_into(private_messages::table)
            .values((
                private_messages::sender_id.eq(s_id),
                private_messages::receiver_id.eq(r_id),
                private_messages::content.eq(msg),
            ))
            .get_result::<PrivateMessageDb>(&mut conn)
            .map_err(|e| e.to_string())?;

        use crate::infrastructure::database::schema::brawlers;
        let s_info = brawlers::table
            .find(s_id)
            .select((brawlers::display_name, brawlers::avatar_url))
            .first::<(String, Option<String>)>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        let r_info = brawlers::table
            .find(r_id)
            .select((brawlers::display_name, brawlers::avatar_url))
            .first::<(String, Option<String>)>(&mut conn)
            .optional()
            .map_err(|e| e.to_string())?;

        let mut entity: PrivateMessage = saved.into();
        if let Some((name, avatar)) = s_info {
            entity.sender_display_name = Some(name);
            entity.sender_avatar_url = avatar;
        }
        if let Some((name, avatar)) = r_info {
            entity.receiver_display_name = Some(name);
            entity.receiver_avatar_url = avatar;
        }
        Ok(entity)
    }

    async fn get_conversation(
        &self,
        user1: i32,
        user2: i32,
    ) -> Result<Vec<PrivateMessage>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        let sql = r#"
            SELECT m.id, m.sender_id, s.display_name as sender_name, s.avatar_url as sender_avatar_url, 
                   m.receiver_id, r.display_name as receiver_name, r.avatar_url as receiver_avatar_url, 
                   m.content, m.is_read, m.created_at
            FROM private_messages m
            LEFT JOIN brawlers s ON m.sender_id = s.id
            LEFT JOIN brawlers r ON m.receiver_id = r.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2)
               OR (m.sender_id = $3 AND m.receiver_id = $4)
            ORDER BY m.created_at ASC
        "#;

        diesel::sql_query(sql)
            .bind::<diesel::sql_types::Integer, _>(user1)
            .bind::<diesel::sql_types::Integer, _>(user2)
            .bind::<diesel::sql_types::Integer, _>(user2)
            .bind::<diesel::sql_types::Integer, _>(user1)
            .load::<RecentChatDb>(&mut conn)
            .map(|msgs| msgs.into_iter().map(Into::into).collect())
            .map_err(|e| e.to_string())
    }

    async fn mark_as_read(&self, r_id: i32, s_id: i32) -> Result<(), String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        diesel::update(private_messages::table)
            .filter(private_messages::receiver_id.eq(r_id))
            .filter(private_messages::sender_id.eq(s_id))
            .filter(private_messages::is_read.eq(false))
            .set(private_messages::is_read.eq(true))
            .execute(&mut conn)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    async fn get_unread_count(&self, u_id: i32) -> Result<i64, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        private_messages::table
            .filter(private_messages::receiver_id.eq(u_id))
            .filter(private_messages::is_read.eq(false))
            .count()
            .get_result(&mut conn)
            .map_err(|e| e.to_string())
    }

    async fn get_recent_chats(&self, u_id: i32) -> Result<Vec<PrivateMessage>, String> {
        let mut conn = self.pool.get().map_err(|e| e.to_string())?;

        // Get the latest message for each conversation with display names
        let sql = r#"
            SELECT DISTINCT ON (LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
                m.id, m.sender_id, s.display_name as sender_name, s.avatar_url as sender_avatar_url, 
                m.receiver_id, r.display_name as receiver_name, r.avatar_url as receiver_avatar_url, 
                m.content, m.is_read, m.created_at
            FROM private_messages m
            LEFT JOIN brawlers s ON m.sender_id = s.id
            LEFT JOIN brawlers r ON m.receiver_id = r.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id), m.created_at DESC
        "#;

        diesel::sql_query(sql)
            .bind::<diesel::sql_types::Integer, _>(u_id)
            .load::<RecentChatDb>(&mut conn)
            .map(|msgs| msgs.into_iter().map(Into::into).collect())
            .map_err(|e| e.to_string())
    }
}
