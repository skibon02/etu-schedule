pub mod groups;
pub mod schedule;
pub mod subjects;


#[derive(Debug, PartialEq)]
pub enum MergeResult {
    NotModified,
    Updated,
    Inserted
}
