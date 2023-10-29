CREATE TEMPORARY TABLE departments_backup AS SELECT * FROM departments;

DROP TABLE departments;

CREATE TABLE departments (
     department_id INTEGER PRIMARY KEY,
     title TEXT NOT NULL,
     department_type TEXT NOT NULL, -- This was previously "type"
     faculty_id INTEGER NOT NULL,
     long_title TEXT NOT NULL,
     FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

INSERT INTO departments (department_id, title, department_type, faculty_id, long_title)
SELECT department_id, title, type, faculty_id, long_title FROM departments_backup;

DROP TABLE departments_backup;