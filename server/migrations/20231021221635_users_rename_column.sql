-- Create a temporary table to hold the current data
CREATE TEMPORARY TABLE users_backup AS SELECT * FROM users;

-- Drop the current table
DROP TABLE users;

-- Create a new table with the updated column name
CREATE TABLE users (
    vk_id INTEGER PRIMARY KEY,
    default_group INTEGER,
    creation_date_time INTEGER NOT NULL,
    last_vk_fetch_date_time INTEGER,  -- Updated column name
    profile_photo_url TEXT,
    first_name TEXT,
    last_name TEXT,
    sex INTEGER,
    birthdate TEXT
);

-- Copy the data from the backup table to the new table. Note that the order of columns matters in the SELECT statement.
-- The old column name is still used here since we're pulling from the backup table where the column still has the old name.
INSERT INTO users (vk_id, default_group, creation_date_time, last_vk_fetch_date_time, profile_photo_url, first_name, last_name, sex, birthdate)
SELECT vk_id, default_group, creation_date_time, last_vk_fetch_data_time, profile_photo_url, first_name, last_name, sex, birthdate
FROM users_backup;

-- Drop the temporary table
DROP TABLE users_backup;
