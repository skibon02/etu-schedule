DROP TABLE user_attendance_schedule;

create table user_attendance_schedule (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,

    schedule_obj_time_link_id INT NOT NULL,
    enable_auto_attendance BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(user_id, schedule_obj_time_link_id)
);