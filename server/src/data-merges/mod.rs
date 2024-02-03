pub mod groups;
pub mod schedule;
pub mod subjects;
pub mod teachers;

#[derive(Debug, PartialEq)]
pub enum MergeResult {
    NotModified,
    Updated,
    Inserted,
}
