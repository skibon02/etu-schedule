DROP TABLE schedule_objs;
-- Create a new table with the desired structure
CREATE TABLE schedule_objs (
       schedule_obj_id INTEGER PRIMARY KEY AUTOINCREMENT, -- generated automatically

       group_id INTEGER NOT NULL, -- has associated group, always consistent
       link_id INTEGER NOT NULL, -- generated during merge, used for tracking subject across merges

    -- tracked info with versioning
       subject_id INTEGER NOT NULL, -- has subject with it's own versioning and generation
       subject_gen_id INTEGER NOT NULL, -- generation of known subject at this schedule generation range
       teacher_id INTEGER, -- has optional teacher with it's own versioning and generation
       teacher_gen_id INTEGER, -- generation of teacher at this schedule generation range
       second_teacher_id INTEGER,
       second_teacher_gen_id INTEGER,

    -- other tracking info
       auditorium TEXT,
       updated_att TEXT,

    -- time location
       time INTEGER NOT NULL,
       week_day TEXT NOT NULL,
       week_parity BOOLEAN NOT NULL,

    --generation range information
       gen_start INTEGER NOT NULL,
       gen_end INTEGER,

       FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (gen_start) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (gen_end) REFERENCES schedule_generation(gen_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
       FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);