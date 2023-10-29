-- Create a backup of the 'departments' table
CREATE TEMPORARY TABLE departments_backup AS SELECT * FROM departments;

-- Drop the 'departments' table
DROP TABLE departments;

-- Recreate the 'departments' table with the new 'long_title' column and constraints
CREATE TABLE departments (
                             department_id INTEGER PRIMARY KEY,
                             title TEXT NOT NULL,
                             type TEXT NOT NULL,
                             faculty_id INTEGER NOT NULL,
                             long_title TEXT NOT NULL, -- Adding the new column with NOT NULL constraint (as an example)
                             FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- Copy the data from the backup table to the new 'departments' table (excluding the new column)
INSERT INTO departments (department_id, title, type, faculty_id)
SELECT department_id, title, type, faculty_id FROM departments_backup;

-- At this point, you may want to update the 'long_title' column values before proceeding,
-- as they are currently NOT NULL. You could set a default value or use existing field values for this purpose.

-- Drop the backup table
DROP TABLE departments_backup;