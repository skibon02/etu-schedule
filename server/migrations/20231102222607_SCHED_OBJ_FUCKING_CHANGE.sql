DROP TABLE schedule_objs;
-- Create a new table with the desired structure
CREATE TABLE schedule_objs (
       schedule_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- generated automatically

    -- untracked info
       last_known_orig_sched_obj_id INTEGER NOT NULL, -- can be modified -> not tracked
       updated_at TEXT, -- can be modified -> not tracked

    -- immutable for row
       group_id INTEGER NOT NULL, -- immutable for row constantly
       link_id INTEGER NOT NULL, -- generated during merge, used for tracking subject across merges. immutable for row constantly

    -- tracked info with versioning
       subject_id INTEGER NOT NULL, -- has subject with it's own versioning and generation
       subject_gen_id INTEGER NOT NULL, -- generation of known subject at this schedule generation range
       teacher_id INTEGER, -- has optional teacher with it's own versioning and generation
       teacher_gen_id INTEGER, -- generation of teacher at this schedule generation range
       second_teacher_id INTEGER, -- immutable for row, duplicate on change
       second_teacher_gen_id INTEGER,

    -- other tracking info
       auditorium TEXT, -- immutable for row, duplicate on change

    -- time location
       time INTEGER NOT NULL, -- immutable for row, duplicate on change
       week_day TEXT NOT NULL, -- immutable for row, duplicate on change
       week_parity BOOLEAN NOT NULL, -- immutable for row, duplicate on change

    --generation range information
       gen_start INTEGER NOT NULL, -- immutable for row constantly
       gen_end INTEGER,
       existence_diff TEXT NOT NULL, -- relation to previous generation obj with same link_id, can be "new", "changed". immutable for row

    -- constraints

       FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (gen_start) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (gen_end) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TEMPORARY TABLE departments_backup AS SELECT * FROM departments;

DROP TABLE departments;

CREATE TABLE departments (
     department_id INTEGER PRIMARY KEY,
     title TEXT NOT NULL,
     department_type TEXT NOT NULL,
     faculty_id INTEGER, -- now optional
     long_title TEXT, -- now optional
     FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO departments (department_id, title, department_type, faculty_id, long_title)
SELECT department_id, title, department_type, faculty_id, long_title FROM departments_backup;

DROP TABLE departments_backup;