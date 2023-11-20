delete from user_data;
delete from users;

drop table user_data;
create table user_data
(
    user_id             INT PRIMARY KEY
        references users
            on update cascade on delete cascade,
    subjects_title_formatting      TEXT default 'auto' not null,
    group_id                       INT
                                                       references groups
                                                           on update cascade on delete set null,
    last_known_schedule_generation INT,
    check (subjects_title_formatting IN ('auto', 'shorten'))
);
