pub mod periodic_schedule_merge;

pub use periodic_schedule_merge::*;
use std::collections::btree_map::Entry;
pub mod priority_schedule_merge;
pub use priority_schedule_merge::*;
pub mod attendance_keep_alive;
pub use attendance_keep_alive::*;
pub mod attendance_worker;
pub use attendance_worker::*;

use anyhow::Context;
use sqlx::PgConnection;
use std::collections::BTreeMap;
use std::time::Instant;

use crate::api::etu_api;
use crate::data_merges;
use crate::models::groups::DepartmentModel;
use crate::models::schedule::{ScheduleObjModel, ScheduleObjModelNormalized};
use crate::models::subjects::{get_subjects_cur_gen, SubjectModel};
use crate::models::teachers::{get_teachers_cur_gen, TeacherModel};

const ETU_REQUEST_INTERVAL: u64 = 15;

async fn process_schedule_merge(
    group_id_vec: Vec<i32>,
    con: &mut PgConnection,
) -> anyhow::Result<()> {
    let new_groups = etu_api::get_groups_list()
        .await
        .context("Getting ETU groups list from process_schedule_merge")?;
    data_merges::groups::groups_merge(&new_groups, &mut *con).await?;

    info!("BGTASK: Starting merge for groups: {:?}", group_id_vec);
    let start = Instant::now();
    let sched_objs = etu_api::get_schedule_objs_groups(group_id_vec.clone())
        .await
        .context("Getting schedule objs groups from process_schedule_merge")?;

    let last_subjects_generation = get_subjects_cur_gen(&mut *con).await?;
    let last_teachers_generation = get_teachers_cur_gen(&mut *con).await?;

    //TODO: parallelize with rayon
    for (group_id, sched_objs) in sched_objs {
        info!("BGTASK: Starting merge for group id {}", group_id);
        let mut sched_objs_models: Vec<ScheduleObjModelNormalized> = Vec::new();
        let mut subjects: BTreeMap<i32, Vec<SubjectModel>> = BTreeMap::new();
        let mut departments: Vec<DepartmentModel> = Vec::new();
        let mut teachers: BTreeMap<i32, (TeacherModel, Vec<String>)> = BTreeMap::new();

        for sched_obj_orig in sched_objs.schedule_objects {
            sched_objs_models.push(sched_obj_orig.clone().try_into().unwrap());
            subjects
                .entry(sched_obj_orig.lesson.subject.id)
                .or_default()
                .push(sched_obj_orig.lesson.subject.clone().into());
            departments.push(sched_obj_orig.lesson.subject.department.into());

            if let Some(combined_teachers) = sched_obj_orig.lesson.combined_teachers {
                for teacher in combined_teachers {
                    let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                    teachers.insert(teacher_model.0.teacher_id, teacher_model);
                }
            } else {
                if let Some(teacher) = sched_obj_orig.lesson.teacher {
                    let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                    teachers.insert(teacher_model.0.teacher_id, teacher_model);
                }
                if let Some(teacher) = sched_obj_orig.lesson.second_teacher {
                    let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                    teachers.insert(teacher_model.0.teacher_id, teacher_model);
                }
            }
        }
        for department in departments {
            data_merges::groups::department_single_merge(department, None, &mut *con).await?;
        }

        data_merges::subjects::subjects_merge(&subjects, last_subjects_generation, &mut *con)
            .await?;
        data_merges::teachers::teachers_merge(teachers, last_teachers_generation, &mut *con)
            .await?;
        data_merges::schedule::schedule_objs_merge(group_id, &sched_objs_models, &mut *con).await?;
    }
    info!(
        "BGTASK: Merge for {} groups finished in {:?}",
        group_id_vec.len(),
        Instant::now() - start
    );

    Ok(())
}

struct FailureDetector {
    failures_cnt: u32,
    success_cnt: u32,
    failures_in_a_row: u32,
    success_in_a_row: u32,

    prev_failure: bool,
    prev_success: bool,

    failures_seq_limit: u32,
    failures_overall_max: u32,
}

impl FailureDetector {
    pub fn new(failures_seq_limit: u32, failures_overall_max: u32) -> Self {
        Self {
            failures_cnt: 0,
            success_cnt: 0,
            failures_in_a_row: 0,
            success_in_a_row: 0,

            prev_failure: false,
            prev_success: false,

            failures_seq_limit,
            failures_overall_max,
        }
    }

    /// returns true if failure limit reached
    pub fn failure(&mut self) -> bool {
        self.failures_cnt += 1;
        self.failures_in_a_row += 1;
        self.success_in_a_row = 0;
        self.prev_failure = true;
        self.prev_success = false;

        if self.failures_in_a_row > self.failures_seq_limit {
            self.failures_in_a_row = 0;
            return true;
        }
        if self.failures_cnt > self.failures_overall_max {
            return true;
        }
        false
    }

    pub fn success(&mut self) {
        self.success_cnt += 1;
        self.success_in_a_row += 1;
        self.failures_in_a_row = 0;
        self.prev_failure = false;
        self.prev_success = true;
    }

    pub fn reset(&mut self) {
        self.failures_cnt = 0;
        self.success_cnt = 0;
        self.failures_in_a_row = 0;
        self.success_in_a_row = 0;
        self.prev_failure = false;
        self.prev_success = false;
    }
}
