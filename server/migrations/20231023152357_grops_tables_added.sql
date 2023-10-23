-- Create a backup of the 'user_group' table
CREATE TEMPORARY TABLE user_group_backup AS SELECT * FROM user_group;

-- Drop the 'user_group' table
DROP TABLE user_group;

-- Recreate the 'user_group' table with the adjusted foreign key constraints
CREATE TABLE user_group (
    user_id INTEGER NOT NULL, 
    group_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users (vk_id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups (group_id) ON DELETE RESTRICT
    -- user_id will cascade on delete, group_id will restrict deletion of the referenced entry
);

-- Populate the new 'user_group' table from the backup
INSERT INTO user_group SELECT * FROM user_group_backup;

-- Drop the backup table
DROP TABLE user_group_backup;


CREATE TABLE faculties (
    faculty_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL  -- or 'title STRING NOT NULL' depending on your preferred keyword
);

-- Create the 'departments' table with the foreign key referencing 'faculties'
CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,  -- or 'title STRING NOT NULL' depending on your preferred keyword
    type TEXT NOT NULL,   -- or 'type STRING NOT NULL' depending on your preferred keyword
    faculty_id INTEGER NOT NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id) ON UPDATE RESTRICT ON DELETE RESTRICT
);

-- Create a backup of the 'groups' table
CREATE TEMPORARY TABLE groups_backup AS SELECT * FROM groups;

-- Drop the 'groups' table
DROP TABLE groups;

-- Recreate the 'groups' table with the foreign key
CREATE TABLE groups (
    group_id INTEGER PRIMARY KEY,
    number TEXT NOT NULL,
    studying_type TEXT NOT NULL CHECK(length(studying_type) <= 5),
    education_level TEXT NOT NULL CHECK(length(education_level) <= 5),
    startYear INTEGER NOT NULL,
    endYear INTEGER NOT NULL,
    speciality_id INTEGER NOT NULL, 
    department_id INTEGER NOT NULL, -- This is the new foreign key field
    FOREIGN KEY (department_id) REFERENCES departments (department_id) ON DELETE RESTRICT ON UPDATE RESTRICT
    -- This constraint ensures that entries in 'departments' referenced by 'groups' cannot be casually deleted or updated
);

-- Copy the data from the backup table to the new 'groups' table
-- Note: This assumes that the 'department_id' in the new 'groups' table can accept all values from the old table.
-- You may need to ensure that these 'department_id' values already exist in the 'departments' table.
INSERT INTO groups 
SELECT * 
FROM groups_backup;

-- Drop the backup table
DROP TABLE groups_backup;

