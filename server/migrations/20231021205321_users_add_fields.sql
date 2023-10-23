-- Create a temporary table to hold the data during migration
CREATE TEMPORARY TABLE users_backup AS SELECT * FROM users;

-- Drop the original table
DROP TABLE users;

-- Create the table again with the updated schema including new columns and the renamed column
CREATE TABLE users (
    vk_id INTEGER PRIMARY KEY,
    default_group INTEGER,
    creation_date_time INTEGER NOT NULL,
    last_vk_fetch_data_time INTEGER,  -- Renamed from last_action_date_time
    profile_photo_url TEXT,            -- New column
    first_name TEXT,                   -- New column
    last_name TEXT,                    -- New column
    sex INTEGER,                       -- New column
    birthdate TEXT                     -- New column
);

-- Populate the new table with the data from the backup table. Since new fields are nullable,
-- you don't need to populate them here; they will be set to NULL by default.
INSERT INTO users (vk_id, default_group, creation_date_time, last_vk_fetch_data_time)
SELECT
    vk_id,
    default_group,
    creation_date_time,
    last_action_date_time  -- This is the old column name in the backup; SQLite will match it with the new column name in the users table.
FROM
    users_backup;

-- Drop the temporary table
DROP TABLE users_backup;
