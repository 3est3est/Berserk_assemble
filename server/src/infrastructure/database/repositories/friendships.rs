use async_trait::async_trait;
use diesel::prelude::*;
use std::sync::Arc;

use crate::{
    domain::{
        entities::friendships::{FriendshipEntity, NewFriendshipEntity, PendingRequestDto},
        repositories::friendship_repository::FriendshipRepository,
    },
    infrastructure::database::{
        postgresql_connection::PgPoolSquad,
        schema::{brawlers, friendships},
    },
};

pub struct FriendshipPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl FriendshipPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl FriendshipRepository for FriendshipPostgres {
    async fn create(&self, friendship: NewFriendshipEntity) -> Result<FriendshipEntity, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        diesel::insert_into(friendships::table)
            .values(&friendship)
            .get_result::<FriendshipEntity>(&mut connection)
            .map_err(|e| e.to_string())
    }

    async fn find_by_id(&self, id: i32) -> Result<Option<FriendshipEntity>, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        friendships::table
            .find(id)
            .first::<FriendshipEntity>(&mut connection)
            .optional()
            .map_err(|e| e.to_string())
    }

    async fn find_by_users(
        &self,
        user1_id: i32,
        user2_id: i32,
    ) -> Result<Option<FriendshipEntity>, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        friendships::table
            .filter(
                (friendships::requester_id
                    .eq(user1_id)
                    .and(friendships::receiver_id.eq(user2_id)))
                .or(friendships::requester_id
                    .eq(user2_id)
                    .and(friendships::receiver_id.eq(user1_id))),
            )
            .first::<FriendshipEntity>(&mut connection)
            .optional()
            .map_err(|e| e.to_string())
    }

    async fn update_status(&self, id: i32, status: &str) -> Result<FriendshipEntity, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        diesel::update(friendships::table.find(id))
            .set((
                friendships::status.eq(status),
                friendships::updated_at.eq(diesel::dsl::now),
            ))
            .get_result::<FriendshipEntity>(&mut connection)
            .map_err(|e| e.to_string())
    }

    async fn delete(&self, id: i32) -> Result<(), String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        diesel::delete(friendships::table.find(id))
            .execute(&mut connection)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    async fn list_friends(&self, user_id: i32) -> Result<Vec<i32>, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        let requester_friends = friendships::table
            .filter(friendships::requester_id.eq(user_id))
            .filter(friendships::status.eq("accepted"))
            .select(friendships::receiver_id)
            .load::<i32>(&mut connection)
            .map_err(|e| e.to_string())?;

        let receiver_friends = friendships::table
            .filter(friendships::receiver_id.eq(user_id))
            .filter(friendships::status.eq("accepted"))
            .select(friendships::requester_id)
            .load::<i32>(&mut connection)
            .map_err(|e| e.to_string())?;

        let mut all = requester_friends;
        all.extend(receiver_friends);
        Ok(all)
    }

    async fn list_pending_requests(&self, user_id: i32) -> Result<Vec<PendingRequestDto>, String> {
        let mut connection = Arc::clone(&self.db_pool).get().map_err(|e| e.to_string())?;

        friendships::table
            .inner_join(brawlers::table.on(friendships::requester_id.eq(brawlers::id)))
            .filter(friendships::receiver_id.eq(user_id))
            .filter(friendships::status.eq("pending"))
            .select((
                friendships::id,
                friendships::requester_id,
                brawlers::display_name,
                brawlers::avatar_url,
                friendships::created_at,
            ))
            .load::<(i32, i32, String, Option<String>, chrono::NaiveDateTime)>(&mut connection)
            .map(|rows| {
                rows.into_iter()
                    .map(|(id, req_id, name, avatar, created)| PendingRequestDto {
                        id,
                        requester_id: req_id,
                        requester_name: name,
                        requester_avatar: avatar,
                        created_at: created,
                    })
                    .collect()
            })
            .map_err(|e| e.to_string())
    }
}
