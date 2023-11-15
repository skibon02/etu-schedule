create table user_data (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,
    -- valid values are "auto" or "shorten"
    subjects_title_formatting TEXT NOT NULL DEFAULT 'auto' CHECK (subjects_title_formatting IN ('auto', 'shorten')),

    group_id INT REFERENCES groups(group_id) ON DELETE SET NULL ON UPDATE CASCADE,
    -- in respect to group_id
    last_known_schedule_generation INT REFERENCES schedule_generation(gen_id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE user_attendance_schedule (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,

    schedule_obj_time_link_id INT NOT NULL REFERENCES schedule_objs(link_id) ON DELETE CASCADE ON UPDATE CASCADE,
    enable_auto_attendance BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE user_attendance_schedule_diffs (
    user_id INT NOT NULL REFERENCES users(vk_id) ON DELETE CASCADE ON UPDATE CASCADE,

    schedule_obj_time_link_id INT NOT NULL REFERENCES schedule_objs(link_id) ON DELETE CASCADE ON UPDATE CASCADE,
    week_num INT NOT NULL,
    enable_auto_attendance BOOLEAN NOT NULL DEFAULT TRUE
);

DROP TABLE user_group;