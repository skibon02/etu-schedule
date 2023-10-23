-- Create a temporary table to hold the data during migration
CREATE TEMPORARY TABLE users_backup AS SELECT * FROM users;

-- Drop the original table
DROP TABLE users;

-- Create the table again with the updated schema
CREATE TABLE users (
    vk_id INTEGER PRIMARY KEY,
    default_group INTEGER,
    creation_date_time INTEGER NOT NULL,
    last_action_date_time INTEGER
);

-- Populate the new table with the data from the backup table,
-- converting the date and time values to Unix Timestamp format
INSERT INTO users
SELECT
    vk_id,
    default_group,
    strftime('%s', creation_date_time),
    CASE WHEN last_action_date_time IS NOT NULL THEN strftime('%s', last_action_date_time) ELSE NULL END
FROM
    users_backup;

-- Drop the temporary table
DROP TABLE users_backup;
