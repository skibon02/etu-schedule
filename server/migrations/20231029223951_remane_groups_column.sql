-- Create a backup of the 'groups' table
CREATE TEMPORARY TABLE groups_backup AS SELECT * FROM groups;

-- Drop the 'groups' table
DROP TABLE groups;

-- Recreate the 'groups' table with the column 'specialty_id' instead of 'speciality_id'
CREATE TABLE groups (
                        group_id INTEGER PRIMARY KEY,
                        number TEXT NOT NULL,
                        studying_type TEXT NOT NULL CHECK(length(studying_type) <= 5),
                        education_level TEXT NOT NULL CHECK(length(education_level) <= 5),
                        start_year INTEGER NOT NULL,
                        end_year INTEGER NOT NULL,
                        specialty_id INTEGER NOT NULL,  -- renamed from 'speciality_id'
                        department_id INTEGER NOT NULL,
                        FOREIGN KEY (department_id) REFERENCES departments (department_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Copy the data from the backup table to the new 'groups' table with the renamed column
INSERT INTO groups (group_id, number, studying_type, education_level, start_year, end_year, specialty_id, department_id)
SELECT group_id, number, studying_type, education_level, start_year, end_year, speciality_id, department_id FROM groups_backup;

-- Drop the backup table
DROP TABLE groups_backup;