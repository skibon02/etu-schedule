-- make column not null
ALTER TABLE subjects ALTER COLUMN short_title SET NOT NULL;
ALTER TABLE subjects ALTER COLUMN subject_type SET NOT NULL;