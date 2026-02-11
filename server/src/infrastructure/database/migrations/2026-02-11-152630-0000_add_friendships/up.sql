CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL REFERENCES brawlers(id),
    receiver_id INT NOT NULL REFERENCES brawlers(id),
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_friendship UNIQUE (requester_id, receiver_id)
);
