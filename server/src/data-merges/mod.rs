pub mod users;
pub mod groups;


#[derive(Debug)]
pub enum MergeResult {
    NotModified,
    Updated,
    Inserted
}
