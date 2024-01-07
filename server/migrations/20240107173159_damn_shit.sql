-- Add migration script here

ALTER TABLE users DROP COLUMN leader_for_group;
ALTER TABLE user_data ADD COLUMN leader_for_group INTEGER;