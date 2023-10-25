-- Create a temporary table to back up the current data
CREATE TEMPORARY TABLE users_backup AS SELECT * FROM users;

-- Drop the current table
DROP TABLE users;

-- Create a new table without the 'default_group' column
CREATE TABLE users (
    vk_id INTEGER PRIMARY KEY,
    creation_date_time INTEGER NOT NULL,
    last_vk_fetch_date_time INTEGER,
    profile_photo_url TEXT,
    first_name TEXT,
    last_name TEXT,
    sex INTEGER,
    birthdate TEXT
);

-- Copy the data from the backup table to the new table, excluding the 'default_group' column
INSERT INTO users (vk_id, creation_date_time, last_vk_fetch_date_time, profile_photo_url, first_name, last_name, sex, birthdate)
SELECT vk_id, creation_date_time, last_vk_fetch_date_time, profile_photo_url, first_name, last_name, sex, birthdate
FROM users_backup;

-- Drop the temporary table
DROP TABLE users_backup;
