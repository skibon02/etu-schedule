CREATE TABLE teachers (
      teacher_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- New autoincrement primary key
      teacher_id INTEGER NOT NULL,  -- Now allows non-unique values

    -- Tracked fields
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    midname TEXT NOT NULL,
    birthday TEXT,
    email TEXT,
    group_id INTEGER,


    -- Untracked fields

    -- tracking info
      gen_start INTEGER NOT NULL,
      gen_end INTEGER,
      existence_diff TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

drop table schedule_generation;
CREATE TABLE schedule_generation (
    gen_id INTEGER NOT NULL,
    creation_time INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    UNIQUE (group_id, gen_id)
);

drop table subjects_generation;
CREATE TABLE subjects_generation (
    gen_id INTEGER PRIMARY KEY,
    creation_time INTEGER NOT NULL
);

CREATE TABLE teachers_generation (
    gen_id INTEGER PRIMARY KEY,
    creation_time INTEGER NOT NULL
);

DROP TABLE schedule_objs;
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
    third_teacher_id INTEGER,
    third_teacher_gen_id INTEGER,

    -- other tracking info
    auditorium TEXT, -- immutable for row, duplicate on change

    -- time location
    time INTEGER NOT NULL, -- immutable for row, duplicate on change
    week_day TEXT NOT NULL, -- immutable for row, duplicate on change
    week_parity TEXT NOT NULL, -- immutable for row, duplicate on change

    --generation range information
    gen_start INTEGER NOT NULL, -- immutable for row constantly
    gen_end INTEGER,
    existence_diff TEXT NOT NULL, -- relation to previous generation obj with same link_id, can be "new", "changed". immutable for row

    -- constraints

    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (subject_gen_id) REFERENCES subjects_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT
--     FOREIGN KEY (teacher_gen_id) REFERENCES teachers_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT
--     FOREIGN KEY (second_teacher_gen_id) REFERENCES teachers_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
--     FOREIGN KEY (third_teacher_gen_id) REFERENCES teachers_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);