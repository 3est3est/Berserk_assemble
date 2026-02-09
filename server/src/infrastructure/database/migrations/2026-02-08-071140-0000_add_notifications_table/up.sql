CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    brawler_id INT NOT NULL REFERENCES brawlers(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    related_id INT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_brawler_id ON notifications(brawler_id);
