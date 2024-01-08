-- f king notes <-.->
CREATE table user_notes(
    user_id INTEGER NOT NULL REFERENCES users
        ON DELETE CASCADE ON UPDATE CASCADE,
    text TEXT NOT NULL,
    creation_timestamp timestamp default now() not null,
    modified_timestamp timestamp,

    week_num INTEGER NOT NULL,
    schedule_obj_time_link_id INTEGER,

    PRIMARY KEY(user_id, week_num, schedule_obj_time_link_id)
);


CREATE table group_notes(
    group_id INTEGER NOT NULL REFERENCES groups
        ON DELETE CASCADE ON UPDATE CASCADE,
    text TEXT NOT NULL,
    creation_timestamp timestamp default now() not null,
    modified_timestamp timestamp,

    week_num INTEGER NOT NULL,
    schedule_obj_time_link_id INTEGER,

    PRIMARY KEY(group_id, week_num, schedule_obj_time_link_id)
);