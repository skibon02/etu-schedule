pub mod periodic_schedule_merge;
pub use periodic_schedule_merge::*;
pub mod priority_schedule_merge;
pub use priority_schedule_merge::*;
pub mod attendance_keep_alive;
pub use attendance_keep_alive::*;
pub mod attendance_worker;
pub use attendance_worker::*;


use std::collections::BTreeMap;
use std::time::Instant;
use sqlx::PgConnection;

use crate::api::etu_api;
use crate::data_merges;
use crate::models::groups::DepartmentModel;
use crate::models::schedule::ScheduleObjModel;
use crate::models::subjects::{get_subjects_cur_gen, SubjectModel};
use crate::models::teachers::{get_teachers_cur_gen, TeacherModel};


const ETU_REQUEST_INTERVAL: u64 = 15;

async fn process_schedule_merge(group_id_vec: Vec<i32>, con: &mut PgConnection) {

    let new_groups = etu_api::get_groups_list().await.unwrap();
    data_merges::groups::groups_merge(&new_groups, &mut *con).await.unwrap();

    info!("BGTASK: Starting merge for groups: {:?}", group_id_vec);
    let start = Instant::now();
    let sched_objs = etu_api::get_schedule_objs_groups(group_id_vec.clone()).await.unwrap();

    let last_subjects_generation = get_subjects_cur_gen(&mut *con).await.unwrap();
    let last_teachers_generation = get_teachers_cur_gen(&mut *con).await.unwrap();

    //TODO: parallelize with rayon
    for (group_id, sched_objs) in sched_objs {
        info!("BGTASK: Starting merge for group id {}", group_id);
        let mut sched_objs_models: Vec<ScheduleObjModel> = Vec::new();
        let mut subjects: BTreeMap<i32, Vec<SubjectModel>> = BTreeMap::new();
        let mut departments: Vec<DepartmentModel> = Vec::new();
        let mut teachers: BTreeMap<i32, (TeacherModel, Vec<String>)> = BTreeMap::new();

        for sched_obj_orig in sched_objs.schedule_objects {
            sched_objs_models.push(sched_obj_orig.clone().try_into().unwrap());
            subjects.entry(sched_obj_orig.lesson.subject.id).or_default().push(sched_obj_orig.lesson.subject.clone().into());
            departments.push(sched_obj_orig.lesson.subject.department.into());

            if let Some(teacher) = sched_obj_orig.lesson.teacher {
                let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                teachers.insert(teacher_model.0.teacher_id, teacher_model);
            }
            if let Some(teacher) = sched_obj_orig.lesson.second_teacher {
                let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                teachers.insert(teacher_model.0.teacher_id, teacher_model);
            }
            if let Some(teacher) = sched_obj_orig.lesson.third_teacher {
                let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                teachers.insert(teacher_model.0.teacher_id, teacher_model);
            }
            if let Some(teacher) = sched_obj_orig.lesson.fourth_teacher {
                let teacher_model: (TeacherModel, Vec<String>) = teacher.into();
                teachers.insert(teacher_model.0.teacher_id, teacher_model);
            }
        }
        for department in departments {
            data_merges::groups::department_single_merge(department, None, &mut *con).await.unwrap();
        }

        data_merges::subjects::subjects_merge(&subjects, last_subjects_generation, &mut *con).await.unwrap();
        data_merges::teachers::teachers_merge(teachers, last_teachers_generation, &mut *con).await.unwrap();
        data_merges::schedule::schedule_objs_merge(group_id, &sched_objs_models, &mut *con).await.unwrap();
    }
    info!("BGTASK: Merge for {} groups finished in {:?}", group_id_vec.len(), (Instant::now() - start));
}