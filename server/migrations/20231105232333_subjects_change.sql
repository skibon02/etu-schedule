-- Drop the existing 'subjects' table

DELETE FROM schedule_objs;
delete from schedule_generation;

DROP TABLE subjects;

delete from subjects_generation;

drop table schedule_objs;

-- Recreate the 'subjects' table with the new schema
CREATE TABLE subjects (
      subject_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- New autoincrement primary key
      subject_id INTEGER NOT NULL,  -- Now allows non-unique values

    -- Tracked fields
      title TEXT NOT NULL,
      short_title TEXT,
      subject_type TEXT,
      control_type TEXT,

    -- Untracked fields
      semester INTEGER NOT NULL,
      alien_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,

    -- tracking info
      gen_start INTEGER NOT NULL,
      gen_end INTEGER,
      existence_diff TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);


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
    FOREIGN KEY (gen_end) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);