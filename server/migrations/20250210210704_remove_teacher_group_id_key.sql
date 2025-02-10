-- Add migration script here
ALTER TABLE teachers
    DROP CONSTRAINT teachers_group_id_fkey;