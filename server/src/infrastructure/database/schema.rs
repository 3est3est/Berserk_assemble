// @generated automatically by Diesel CLI.

diesel::table! {
    brawlers (id) {
        id -> Int4,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 255]
        password -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        #[max_length = 50]
        display_name -> Varchar,
        #[max_length = 512]
        avatar_url -> Nullable<Varchar>,
        #[max_length = 255]
        avatar_public_id -> Nullable<Varchar>,
        bio -> Nullable<Text>,
        #[max_length = 255]
        discord_id -> Nullable<Varchar>,
        #[max_length = 255]
        contact_email -> Nullable<Varchar>,
        #[max_length = 255]
        instagram -> Nullable<Varchar>,
        #[max_length = 255]
        facebook -> Nullable<Varchar>,
    }
}

diesel::table! {
    crew_memberships (mission_id, brawler_id) {
        mission_id -> Int4,
        brawler_id -> Int4,
        joined_at -> Timestamp,
    }
}

diesel::table! {
    friendships (id) {
        id -> Int4,
        requester_id -> Int4,
        receiver_id -> Int4,
        #[max_length = 255]
        status -> Varchar,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    mission_comments (id) {
        id -> Int4,
        mission_id -> Int4,
        brawler_id -> Int4,
        content -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    missions (id) {
        id -> Int4,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 255]
        status -> Varchar,
        chief_id -> Int4,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
        max_crew -> Int4,
        scheduled_at -> Nullable<Timestamp>,
        #[max_length = 255]
        location -> Nullable<Varchar>,
        category -> Varchar,
    }
}

diesel::table! {
    notifications (id) {
        id -> Int4,
        brawler_id -> Int4,
        #[sql_name = "type"]
        #[max_length = 255]
        type_ -> Varchar,
        content -> Text,
        related_id -> Nullable<Int4>,
        is_read -> Bool,
        created_at -> Timestamp,
    }
}

diesel::table! {
    private_messages (id) {
        id -> Int4,
        sender_id -> Int4,
        receiver_id -> Int4,
        content -> Text,
        is_read -> Bool,
        created_at -> Timestamp,
    }
}

diesel::joinable!(crew_memberships -> brawlers (brawler_id));
diesel::joinable!(crew_memberships -> missions (mission_id));
diesel::joinable!(mission_comments -> brawlers (brawler_id));
diesel::joinable!(mission_comments -> missions (mission_id));
diesel::joinable!(missions -> brawlers (chief_id));
diesel::joinable!(notifications -> brawlers (brawler_id));

diesel::allow_tables_to_appear_in_same_query!(
    brawlers,
    crew_memberships,
    friendships,
    mission_comments,
    missions,
    notifications,
    private_messages,
);
