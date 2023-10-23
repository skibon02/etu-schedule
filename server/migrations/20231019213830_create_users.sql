-- Add migration script here
CREATE TABLE IF NOT EXISTS users (
    vk_id INTEGER PRIMARY KEY,  -- User's VK ID as the primary key
    default_group INTEGER,      -- Default group ID, which is a foreign key reference, and can be NULL
    creation_date_time TEXT NOT NULL,  -- User's creation date and time, stored as TEXT in ISO format
    last_action_date_time TEXT -- User's last action date and time, can be NULL initially or in cases of inactivity
);
