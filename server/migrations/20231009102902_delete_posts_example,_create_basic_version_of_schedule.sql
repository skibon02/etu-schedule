DROP table posts;
CREATE TABLE schedule_objs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    schedule_obj_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,

    group_id INTEGER NOT NULL,

    group_generation_id INTEGER NOT NULL, -- generation for group
    link_id INTEGER NOT NULL, -- for subject+group consistent across group_generation_id, different for 

    

-- connections to other tables, gen is increased on change
    subject_id INTEGER NOT NULL,
    subject_gen_id INTEGER NOT NULL,

    teacher_id INTEGER,
    teacher_gen_id INTEGER,

    second_teacher_id INTEGER,
    second_teacher_gen_id INTEGER,

-- local info
    auditorium TEXT, -- can be empty

-- time_start + time_end + week_day + week_two unique for single group+generation
    time INTEGER NOT NULL, 
    week_day TEXT NOT NULL,
    week_two BOOLEAN NOT NULL, -- false is week one
);

