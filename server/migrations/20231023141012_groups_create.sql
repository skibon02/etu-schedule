-- Create the 'user_group' table
CREATE TABLE user_group (
    user_id INTEGER PRIMARY KEY, 
    group_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (vk_id),  -- Assuming 'vk_id' is the primary key for the 'users' table
    FOREIGN KEY (group_id) REFERENCES groups (group_id) -- This assumes the 'groups' table will be created and will use 'group_id' as a primary key.
    -- Consider adding ON DELETE and ON UPDATE actions based on your requirements.
);

-- Create the 'groups' table
CREATE TABLE groups (
    group_id INTEGER PRIMARY KEY,
    number TEXT NOT NULL,
    studying_type TEXT NOT NULL CHECK(length(studying_type) <= 5), -- ensures the string is no longer than 5 characters
    education_level TEXT NOT NULL CHECK(length(education_level) <= 5), -- ensures the string is no longer than 5 characters
    startYear INTEGER NOT NULL,
    endYear INTEGER NOT NULL,
    speciality_id INTEGER NOT NULL, -- Consider if this is a foreign key relating to another 'specialities' table
    department_id INTEGER NOT NULL  -- Same consideration for this being a foreign key relating to a 'departments' table
    -- You may want to add foreign key constraints here if 'speciality_id' and 'department_id' reference other tables.
);
