create table schedule_objs_teachers(
    schedule_obj_id int not null references schedule_objs(schedule_obj_id),
    teacher_id int not null,
    primary key(schedule_obj_id, teacher_id)
);

-- move all non-null teacher_id values from schedule_objs to schedule_objs_teachers
insert into schedule_objs_teachers(schedule_obj_id, teacher_id)
select schedule_obj_id, teacher_id
from schedule_objs
where teacher_id is not null;

insert into schedule_objs_teachers(schedule_obj_id, teacher_id)
select schedule_obj_id, second_teacher_id
from schedule_objs
where second_teacher_id is not null;

insert into schedule_objs_teachers(schedule_obj_id, teacher_id)
select schedule_obj_id, third_teacher_id
from schedule_objs
where third_teacher_id is not null;

insert into schedule_objs_teachers(schedule_obj_id, teacher_id)
select schedule_obj_id, fourth_teacher_id
from schedule_objs
where fourth_teacher_id is not null;

-- drop the teacher_id columns from schedule_objs

alter table schedule_objs drop column teacher_id;
alter table schedule_objs drop column second_teacher_id;
alter table schedule_objs drop column third_teacher_id;
alter table schedule_objs drop column fourth_teacher_id;