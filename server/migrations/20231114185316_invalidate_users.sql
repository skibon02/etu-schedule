drop table user_attendance_schedule_diffs;

create table user_attendance_schedule_diffs
(
    user_id                   INT                  not null
        references users
            on update cascade on delete cascade,
    schedule_obj_time_link_id INT                  not null,
    week_num                  INT                  not null,
    enable_auto_attendance    BOOLEAN default TRUE not null
);
drop table user_attendance_schedule;

create table user_attendance_schedule (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,

    schedule_obj_time_link_id INT NOT NULL,
    enable_auto_attendance BOOLEAN NOT NULL DEFAULT TRUE
);

drop table user_data;

create table user_data (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,
    -- valid values are "auto" or "shorten"
    subjects_title_formatting TEXT NOT NULL DEFAULT 'auto' CHECK (subjects_title_formatting IN ('auto', 'shorten')),

    group_id INT REFERENCES groups(group_id) ON DELETE SET NULL ON UPDATE CASCADE,
    -- in respect to group_id
    last_known_schedule_generation INT
);

delete from USERS;