drop table teachers;
CREATE TABLE teachers (
    teacher_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- New autoincrement primary key
    teacher_id INTEGER NOT NULL,  -- Now allows non-unique values

    -- Tracked fields
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    midname TEXT NOT NULL,
    birthday TEXT NOT NULL,
    email TEXT,
    group_id INTEGER,
    is_worker BOOLEAN NOT NULL,
    is_department_head BOOLEAN NOT NULL,
    is_department_dispatcher BOOLEAN NOT NULL,
    is_student BOOLEAN NOT NULL,
    position TEXT,
    degree TEXT,
    rank  TEXT,

    -- tracking info
    gen_start INTEGER NOT NULL,
    gen_end INTEGER,
    existence_diff TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE teachers_departments (
    teachers_departments integer primary key autoincrement,
    teacher_id integer not null,
    department TEXT NOT NULL
);