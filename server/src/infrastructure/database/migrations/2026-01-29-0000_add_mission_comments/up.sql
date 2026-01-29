CREATE TABLE mission_comments (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    brawler_id INTEGER NOT NULL REFERENCES brawlers(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
