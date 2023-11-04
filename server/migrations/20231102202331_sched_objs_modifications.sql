
CREATE TABLE schedule_generation (
     gen_id INTEGER PRIMARY KEY,
     creation_time INTEGER NOT NULL
);

CREATE TABLE subjects_generation (
     gen_id INTEGER PRIMARY KEY,
     creation_time INTEGER NOT NULL
);

CREATE TABLE subjects (
    subject_id INTEGER PRIMARY KEY,

    link_id INTEGER NOT NULL, -- generated during merge, used for tracking subject across merges

    -- tracked info with versioning
    title TEXT NOT NULL, -- immutable for row, duplicate on change
    short_title TEXT, -- immutable for row, duplicate on change
    subject_type TEXT, -- immutable for row, duplicate on change
    control_type TEXT, -- immutable for row, duplicate on change

    -- untracked info
    semester INTEGER NOT NULL, -- can be modified -> not tracked
    alien_id INTEGER NOT NULL, -- can be modified -> not tracked
    department_id INTEGER NOT NULL, -- can be modified -> not tracked

    --generation range information
    gen_start INTEGER NOT NULL, -- immutable for row constantly
    gen_end INTEGER,
    existence_diff TEXT NOT NULL, -- relation to previous generation obj with same link_id, can be "new", "changed". immutable for row

    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

DROP TABLE schedule_objs;
-- Create a new table with the desired structure
CREATE TABLE schedule_objs (
     schedule_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- generated automatically

     group_id INTEGER NOT NULL, -- has associated group, always consistent
     link_id INTEGER NOT NULL, -- generated during merge, used for tracking subject across merges

    -- tracked info with versioning
     subject_id INTEGER NOT NULL, -- has subject with it's own versioning and generation
     subject_gen_id INTEGER NOT NULL, -- generation of known subject at this schedule generation range
     teacher_id INTEGER, -- has optional teacher with it's own versioning and generation
     teacher_gen_id INTEGER, -- generation of teacher at this schedule generation range
     second_teacher_id INTEGER,
     second_teacher_gen_id INTEGER,

    -- other tracking info
     auditorium TEXT,
     updated_att TEXT,

    -- time location
     time INTEGER NOT NULL,
     week_day TEXT NOT NULL,
     week_parity BOOLEAN NOT NULL,

    --generation range information
     gen_start INTEGER NOT NULL,
     gen_end INTEGER,

     FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
     FOREIGN KEY (gen_start) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
     FOREIGN KEY (gen_end) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);