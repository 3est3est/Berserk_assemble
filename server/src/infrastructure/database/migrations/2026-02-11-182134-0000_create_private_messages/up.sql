CREATE TABLE private_messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES brawlers(id),
    receiver_id INT NOT NULL REFERENCES brawlers(id),
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_conversation ON private_messages(sender_id, receiver_id);
