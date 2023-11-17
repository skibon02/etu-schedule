DROP TABLE user_attendance_schedule_diffs;

create table user_attendance_schedule_diffs (
    user_id                   INT                  not null
        references users
            on update cascade on delete cascade,
    schedule_obj_time_link_id INT                  not null,
    week_num                  INT                  not null,
    enable_auto_attendance    BOOLEAN default TRUE not null,
    UNIQUE(user_id, schedule_obj_time_link_id, week_num)
);