create table faculties
(
    faculty_id SERIAL primary key,
    title      TEXT not null
);

create table departments
(
    department_id   SERIAL primary key,
    title           TEXT not null,
    department_type TEXT not null,
    faculty_id      INTEGER
        references faculties
            on update restrict on delete restrict,
    long_title      TEXT
);

create table groups
(
    group_id              SERIAL primary key,
    number                TEXT    not null,
    studying_type         TEXT    not null check (length(studying_type) <= 5),
    education_level       TEXT    not null check (length(education_level) <= 5),
    start_year            INTEGER not null,
    end_year              INTEGER not null,
    specialty_id          INTEGER not null,
    department_id         INTEGER not null
        references departments(department_id)
            on update restrict on delete restrict,
    latest_schedule_merge_timestamp TIMESTAMP
);

create table schedule_generation
(
    gen_id        INTEGER not null,
    creation_time TIMESTAMP not null DEFAULT NOW(),
    group_id      INTEGER not null
        references groups(group_id)
            on update restrict on delete restrict,
    PRIMARY KEY (gen_id, group_id)
);

create table teachers_generation
(
    gen_id        SERIAL primary key,
    creation_time TIMESTAMP not null DEFAULT NOW()
);

create table teachers
(
    teacher_obj_id           SERIAL PRIMARY KEY,
    teacher_id               INTEGER not null,
    initials                 TEXT    not null,
    name                     TEXT    not null,
    surname                  TEXT    not null,
    midname                  TEXT    not null,
    birthday                 TEXT    not null,
    email                    TEXT,
    group_id                 INTEGER
        references groups
            on update restrict on delete restrict,
    is_worker                BOOLEAN not null,
    is_department_head       BOOLEAN not null,
    is_department_dispatcher BOOLEAN not null,
    is_student               BOOLEAN not null,
    position                 TEXT,
    degree                   TEXT,
    rank                     TEXT,
    gen_start                INTEGER not null
        references teachers_generation(gen_id)
            on update restrict on delete restrict,
    gen_end                  INTEGER
        references teachers_generation(gen_id)
            on update restrict on delete restrict,
    existence_diff           TEXT    not null,

    created_timestamp           TIMESTAMP not null DEFAULT NOW(),
    modified_timestamp          TIMESTAMP not null DEFAULT NOW()
);


create table subjects_generation
(
    gen_id        SERIAL primary key,
    creation_time TIMESTAMP not null DEFAULT NOW()
);

create table subjects
(
    subject_obj_id SERIAL PRIMARY KEY,
    subject_id     INTEGER not null,
    title          TEXT    not null,
    short_title    TEXT,
    subject_type   TEXT,
    control_type   TEXT,
    semester       INTEGER not null,
    alien_id       INTEGER not null,
    department_id  INTEGER not null
        references departments
            on update restrict on delete restrict,
    gen_start      INTEGER not null references subjects_generation(gen_id)
        on update restrict on delete restrict,
    gen_end        INTEGER references subjects_generation(gen_id)
        on update restrict on delete restrict,
    existence_diff TEXT    not null,
    created_timestamp           TIMESTAMP not null DEFAULT NOW(),
    modified_timestamp          TIMESTAMP not null DEFAULT NOW()
);

create TYPE week_day as ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

create table schedule_objs
(
    schedule_obj_id              SERIAL primary key,
    last_known_orig_sched_obj_id INTEGER not null,
    created_timestamp           TIMESTAMP not null DEFAULT NOW(),
    modified_timestamp          TIMESTAMP not null DEFAULT NOW(),

    group_id                     INTEGER not null
        references groups
            on update restrict on delete restrict,
    time_link_id                      INTEGER not null,
    prev_time_link_id                 INTEGER
        references schedule_objs
            on update restrict on delete restrict,
    subject_id                   INTEGER not null,
    subject_gen_id               INTEGER not null
        references subjects_generation(gen_id)
            on update restrict on delete restrict,
    teacher_id                   INTEGER,
    teacher_gen_id               INTEGER
        references teachers_generation(gen_id)
            on update restrict on delete restrict,
    second_teacher_id            INTEGER,
    third_teacher_id             INTEGER,
    fourth_teacher_id            INTEGER,

    auditorium                   TEXT,
    time                         INTEGER not null,
    week_day                     week_day    not null,
    week_parity                  TEXT    not null,
    gen_start                    INTEGER not null,
    FOREIGN KEY (gen_start, group_id) REFERENCES schedule_generation(gen_id, group_id),
    gen_end                      INTEGER,
    FOREIGN KEY (gen_end, group_id) REFERENCES schedule_generation(gen_id, group_id),
    existence_diff               TEXT    not null
);


create table teachers_departments
(
    teachers_departments SERIAL PRIMARY KEY,
    teacher_id           integer not null,
    department           TEXT    not null
);

create table users
(
    vk_id                   SERIAL PRIMARY KEY,
    created_timestamp      TIMESTAMP not null DEFAULT NOW(),
    last_vk_fetch_timestamp TIMESTAMP not null DEFAULT NOW(),
    profile_photo_url       TEXT,
    first_name              TEXT not null,
    last_name               TEXT not null,
    sex                     INTEGER not null,
    birthdate               TEXT
);

CREATE TYPE subjects_title_formatting_type AS ENUM ('auto', 'shorten');

create table user_data
(
    user_id         SERIAL primary key
        references users
            on update cascade on delete cascade,
    subjects_title_formatting      subjects_title_formatting_type default 'auto' not null,
    group_id                       INT
           references groups
               on update cascade on delete set null,
    last_known_schedule_generation INT,
    FOREIGN KEY (last_known_schedule_generation, group_id) REFERENCES schedule_generation(gen_id, group_id),
    attendance_token               TEXT
);


create table user_attendance_schedule
(
    user_id                   INT                  not null
        references users
            on update cascade on delete cascade,
    schedule_obj_time_link_id INT                  not null,
    enable_auto_attendance    BOOLEAN default TRUE not null,
    PRIMARY KEY (user_id, schedule_obj_time_link_id)
);

create table user_attendance_schedule_diffs
(
    user_id                   INT                  not null
        references users
            on update cascade on delete cascade,
    schedule_obj_time_link_id INT                  not null,
    week_num                  INT                  not null,
    enable_auto_attendance    BOOLEAN default TRUE not null,
    PRIMARY KEY (user_id, schedule_obj_time_link_id, week_num)
);