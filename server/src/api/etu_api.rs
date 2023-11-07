use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

use crate::models::groups::{DepartmentModel, FacultyModel, GroupModel};
use crate::models::schedule::{ScheduleObjModel, WeekDay};
use crate::models::subjects::SubjectModel;
use crate::models::teachers::TeacherModel;

use itertools::Itertools;

const BASE_URL_SCHEDULE: &str = "https://digital.etu.ru/api/schedule/";
const BASE_URL_ATTENDANCE: &str = "https://digital.etu.ru/api/attendance/";
const BASE_URL_GENERAL: &str = "https://digital.etu.ru/api/general/";

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FacultyOriginal {
    pub id: u32,
    pub title: String,
}

impl FacultyOriginal {
    pub fn as_model(&self) -> FacultyModel {
        FacultyModel {
            faculty_id: self.id,
            title: self.title.clone(),
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct SubjectDepartmentOriginal {
    pub id: u32,
    pub title: String,
    pub longTitle: Option<String>,
    #[serde(rename = "type")]
    pub _type: String,
}

impl Into<DepartmentModel> for SubjectDepartmentOriginal {
    fn into(self) -> DepartmentModel {
        DepartmentModel {
            department_id: self.id,
            title: self.title,
            long_title: self.longTitle,
            department_type: self._type,
            faculty_id: None,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct DepartmentOriginal {
    pub id: u32,
    pub title: String,
    pub longTitle: Option<String>,
    #[serde(rename = "type")]
    pub _type: String,
    pub faculty: FacultyOriginal
}

impl DepartmentOriginal {
    pub fn as_model(&self) -> DepartmentModel {
        DepartmentModel {
            department_id: self.id,
            title: self.title.clone(),
            long_title: self.longTitle.clone(),
            department_type: self._type.clone(),
            faculty_id: Some(self.faculty.id),
        }
    }
}



#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct GroupOriginal {
    pub fullNumber: String,
    pub id: u32,
    pub number: String,
    pub studyingType: String,
    pub educationLevel: String,
    pub departmentId: u32,
    pub specialtyId: u32,
    pub startYear: u16,
    pub endYear: u16,
    pub department: DepartmentOriginal
}

impl GroupOriginal {
    pub fn as_model(&self) -> GroupModel {
        GroupModel {
            group_id: self.id,
            number: self.number.clone(),
            studying_type: self.studyingType.clone(),
            education_level: self.educationLevel.clone(),
            start_year: self.startYear,
            end_year: self.endYear,
            department_id: self.departmentId,
            specialty_id: self.specialtyId,
        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ReservationTimeOriginal {
    id: u32,
    startTime: u32,
    endTime: u32,
    week: String,
    weekDay: String,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct AuditoriumReservationOriginal {
    id: u32,
    auditoriumNumber: Option<String>,
    description: String,
    #[serde(rename = "type")]
    _type: String,
    reservationTime: ReservationTimeOriginal,
    updatedAt: Option<String>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct SubjectOriginal {
    pub id: u32,
    pub alienId: i32,
    pub title: String,
    pub shortTitle: Option<String>,
    pub subjectType: Option<String>,
    pub controlType: Option<String>,
    pub department: SubjectDepartmentOriginal,
    pub semester: u32,
}

impl Into<SubjectModel> for SubjectOriginal {
    fn into(self) -> SubjectModel {
        SubjectModel {
            subject_id: self.id,
            title: self.title,
            short_title: self.shortTitle,
            alien_id: self.alienId,
            subject_type: self.subjectType,
            control_type: self.controlType,
            department_id: self.department.id,
            semester: self.semester,


            // not related info
            subject_obj_id: Default::default(),
            gen_start: Default::default(),
            gen_end: Default::default(),
            existence_diff: Default::default(),

        }
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct TeacherOriginal {
    id: u32,

    name: String,
    surname: String,
    midname: String,
    initials: String,

    birthday: String,
    email: Option<String>,
    groupId: Option<u32>,

    rank: Option<String>,
    position: Option<String>,
    degree: Option<String>,
    roles: Vec<String>,
    workDepartments: Option<Vec<String>>,
}

impl Into<(TeacherModel, Vec<String>)> for TeacherOriginal {
    fn into(self) -> (TeacherModel, Vec<String>) {
        let fixed_birthday = self.birthday.rsplit("-").join("-");

        let is_worker = self.roles.contains(&"worker".to_string());
        let is_student = self.roles.contains(&"student".to_string());
        let is_department_head = self.roles.contains(&"departmentHead".to_string());
        let is_department_dispatcher = self.roles.contains(&"departmentDispatcher".to_string());
        let teacher = TeacherModel {
            teacher_id: self.id,
            initials: self.initials,
            name: self.name,
            surname: self.surname,
            midname: self.midname,
            birthday: fixed_birthday,
            email: self.email,
            group_id: self.groupId,
            is_worker,
            is_department_head,
            is_department_dispatcher,
            is_student,
            position: self.position.clone(),
            degree: self.degree.clone(),
            rank: self.rank.clone(),

            // db stuff
            gen_end: Default::default(),
            gen_start: Default::default(),
            teacher_obj_id: Default::default(),
            existence_diff: Default::default()

        };
        let work_departments = self.workDepartments.unwrap_or_default();

        (teacher, work_departments)
    }
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct LessonOriginal {
    pub id: u32,
    pub auditoriumReservation: AuditoriumReservationOriginal,
    pub subject: SubjectOriginal,
    pub teacher: Option<TeacherOriginal>,
    pub secondTeacher: Option<TeacherOriginal>,
    // not included in original response
    pub thirdTeacher: Option<TeacherOriginal>,
}

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct ScheduleObjectOriginal {
    pub id: u32,
    pub lesson: LessonOriginal,
}

impl TryInto<ScheduleObjModel> for ScheduleObjectOriginal {
    type Error = String;
    fn try_into(self) -> Result<ScheduleObjModel, String> {
        Ok(ScheduleObjModel {
            updated_at: self.lesson.auditoriumReservation.updatedAt.clone().unwrap_or("updatedAt is None!".to_string()),
            last_known_orig_sched_obj_id: self.id,
            subject_id: self.lesson.subject.id,
            teacher_id: self.lesson.teacher.as_ref().map(|t| t.id),
            second_teacher_id: self.lesson.secondTeacher.as_ref().map(|t| t.id),
            third_teacher_id: self.lesson.thirdTeacher.as_ref().map(|t| t.id),
            auditorium: self.lesson.auditoriumReservation.auditoriumNumber.clone(),
            time: self.lesson.auditoriumReservation.reservationTime.startTime,
            week_day: WeekDay::try_from(self.lesson.auditoriumReservation.reservationTime.weekDay.clone()).map_err(|_| "Cannot parse week day!".to_string())?,
            week_parity: self.lesson.auditoriumReservation.reservationTime.week.clone(),

            // unrelated info
            subject_gen_id: Default::default(),
            teacher_gen_id: Default::default(),
            schedule_obj_id: Default::default(), // db id
            link_id: Default::default(),
            group_id: Default::default(), // known from outside
            gen_start: Default::default(),
            gen_end: Default::default(),
            existence_diff: Default::default()
        })
    }
}


#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct GroupScheduleOriginal {
    pub scheduleObjects: Vec<ScheduleObjectOriginal>,
    #[serde(rename = "id")]
    pub group_id: u32
}

pub async fn get_schedule_objs_group(group: u32) -> Option<GroupScheduleOriginal> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&groups={}",
        BASE_URL_SCHEDULE,
        group
    );
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    let parsed_objs = parse_schedule_objs_groups(body).unwrap();
    parsed_objs.get(0).cloned()
}

pub async fn get_schedule_objs_groups(groups: Vec<u32>) -> Option<BTreeMap<u32, GroupScheduleOriginal>> {
    let url = format!(
        "{}objects/publicated?subjectType=%D0%9B%D0%B5%D0%BA&subjectType=%D0%9F%D1%80&subjectType=%D0%9B%D0%B0%D0%B1&subjectType=%D0%9A%D0%9F&subjectType=%D0%9A%D0%A0&subjectType=%D0%94%D0%BE%D0%B1&subjectType=%D0%9C%D0%AD%D0%BA&subjectType=%D0%9F%D1%80%D0%B0%D0%BA&subjectType=%D0%A2%D0%B5%D1%81%D1%82&withSubjectCode=true&withURL=true&{}",
        BASE_URL_SCHEDULE,
        groups.iter().map(|g| "groups=".to_string()+&g.to_string()).collect::<Vec<String>>().join("&")
    );
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    let parsed_objs = parse_schedule_objs_groups(body).unwrap();
    let res = parsed_objs.into_iter().map(|g| (g.group_id, g)).collect::<BTreeMap<u32, GroupScheduleOriginal>>();

    Some(res)
}

fn parse_schedule_objs_groups(data: String) -> anyhow::Result<Vec<GroupScheduleOriginal>> {
    let sched_objs: Vec<GroupScheduleOriginal> = serde_json::from_str(&data)?;

    let mut res = Vec::<GroupScheduleOriginal>::new();

    // preprocessing: merge same auditoriums
    // 1) by group
    for group_schedule in sched_objs.iter() {
        trace!("Parsing group {}", group_schedule.group_id);
        let mut group_schedule_res = GroupScheduleOriginal {scheduleObjects: Vec::new(), group_id: group_schedule.group_id};

        // 2) by subject and placement
        let mut unique_subject_positions = BTreeMap::<(u32, WeekDay, String, u32), Vec<ScheduleObjectOriginal>>::new();
        for schedule_obj in &group_schedule.scheduleObjects {
            // 3) subdivide start/end time
            for time in (schedule_obj.lesson.auditoriumReservation.reservationTime.startTime%10)..(schedule_obj.lesson.auditoriumReservation.reservationTime.endTime%10+1) {
                let mut sched_obj_clone = schedule_obj.clone();
                sched_obj_clone.lesson.auditoriumReservation.reservationTime.startTime = time;
                sched_obj_clone.lesson.auditoriumReservation.reservationTime.endTime = time;

                unique_subject_positions.entry((schedule_obj.lesson.subject.id,
                                                 WeekDay::try_from(schedule_obj.lesson.auditoriumReservation.reservationTime.weekDay.clone()).unwrap(),
                                                 schedule_obj.lesson.auditoriumReservation.reservationTime.week.clone(),
                                                 time)).or_default().push(sched_obj_clone);
            }
        }

        //check uniqueness
        for (_, mut uniq_placement_elements) in unique_subject_positions.iter_mut() {
            if uniq_placement_elements.len() > 1 {
                //merge
                warn!("During parse sched objs for group id {}...", group_schedule.group_id);
                warn!("Found more than one schedule object for subject at single time placement");
                info!("\tsubject_id: {}", uniq_placement_elements[0].lesson.subject.id);
                info!("\tweek_parity: {}", uniq_placement_elements[0].lesson.auditoriumReservation.reservationTime.week);
                info!("\tweek_day: {}", uniq_placement_elements[0].lesson.auditoriumReservation.reservationTime.weekDay);
                info!("\ttime: {}", uniq_placement_elements[0].lesson.auditoriumReservation.reservationTime.startTime);

                let mut auditoriums = Vec::new();
                if let Some(auditorium) = uniq_placement_elements[0].lesson.auditoriumReservation.auditoriumNumber.clone() {
                    auditoriums.push(auditorium);
                }

                let mut fir: ScheduleObjModel  = uniq_placement_elements[0].clone().try_into().map_err(|e: String| anyhow::anyhow!(e.clone()))?;
                // ensure everything is the same except auditorium
                for i in 1..uniq_placement_elements.len() {

                    if let Some(auditorium) = uniq_placement_elements[i].lesson.auditoriumReservation.auditoriumNumber.clone() {
                        auditoriums.push(auditorium);
                    }

                    //compare with first
                    let cur: ScheduleObjModel = uniq_placement_elements[i].clone().try_into().map_err(|e: String| anyhow::anyhow!(e.clone()))?;
                    if fir.teacher_id == cur.teacher_id &&
                        fir.second_teacher_id == cur.second_teacher_id
                        && fir.third_teacher_id == cur.third_teacher_id {
                        // ok, only auditorium is different
                        info!("Auditorium is different, but everything else is the same, merging...");
                    }
                    else {
                        if fir.teacher_id.is_some() && fir.second_teacher_id.is_none() &&
                            cur.teacher_id.is_some() && cur.second_teacher_id.is_none() {
                            // ok, we can merge it
                            info!("1+1 case");
                            if fir.teacher_id != cur.teacher_id {
                                info!("Two first_teachers case");
                                fir.second_teacher_id = cur.teacher_id;
                                uniq_placement_elements[0].lesson.secondTeacher = uniq_placement_elements[i].lesson.teacher.clone();
                            }
                            else {
                                info!("Two same first_teachers case");
                            }
                        }
                        else {
                            // no teachers is ok
                            if fir.teacher_id.is_none() && fir.second_teacher_id.is_none() &&
                                cur.teacher_id.is_none() && cur.second_teacher_id.is_none() {
                                info!("0+0 case");
                            }
                            else {
                                if fir.second_teacher_id.is_some() && fir.third_teacher_id.is_none() &&
                                    cur.teacher_id.is_some() && cur.second_teacher_id.is_none() {
                                    // ok, we can merge it
                                    info!("2+1 case");
                                    if fir.second_teacher_id != cur.teacher_id &&
                                        cur.teacher_id != fir.teacher_id {
                                        info!("Same, merge not needed");
                                    }
                                    else {
                                        info!("Different, merge needed");
                                        fir.third_teacher_id = cur.teacher_id;
                                        uniq_placement_elements[0].lesson.thirdTeacher = uniq_placement_elements[i].lesson.teacher.clone();
                                    }
                                }
                                else {
                                    error!("Error, only auditorium can be different in unique subject and placement group! abotring...");
                                    return Err(anyhow::anyhow!("Error! only auditorium can be different in unique subject and placement group!"))

                                }
                            }
                        }
                    }
                }
                if auditoriums.len() == 0 {
                    uniq_placement_elements[0].lesson.auditoriumReservation.auditoriumNumber = None;
                }
                else {
                    uniq_placement_elements[0].lesson.auditoriumReservation.auditoriumNumber = Some(auditoriums.join(", "));
                }
                group_schedule_res.scheduleObjects.push(uniq_placement_elements[0].clone());
            }
            else {
                group_schedule_res.scheduleObjects.push(uniq_placement_elements[0].clone());
            }
        }

        res.push(group_schedule_res);
    }
    Ok(res)
}

pub async fn get_groups_list() -> Vec<GroupOriginal> {
    let url = format!("{}dicts/groups?scheduleId=594&withFaculty=true&withSemesterSeasons=false&withFlows=false", BASE_URL_GENERAL);
    let response = reqwest::get(&url).await.unwrap();
    let body = response.text().await.unwrap();

    parse_groups(body).unwrap()
}

fn parse_groups(data: String) -> anyhow::Result<Vec<GroupOriginal>> {
    let input_data: Vec<GroupOriginal> = serde_json::from_str(&data)?;

    Ok(input_data)
}




#[cfg(test)]
mod tests {
    use crate::api::etu_api::{parse_groups, parse_schedule_objs_groups};

    #[test]
    fn parse_groups_wrong_format() -> anyhow::Result<()> {
        let groups = String::from( "[{}]");

        if parse_groups(groups).is_err() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Error"))
        }
    }

    #[test]
    fn parse_groups_test() -> anyhow::Result<()> {
        // load from file "groups_response_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/groups_response_test.txt")?;

        let res = parse_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
    #[test]
    fn parse_schedule_very_big_test() -> anyhow::Result<()> {
        // load from file "whole_semester_schedule_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/whole_semester_schedule_test.txt")?;

        let res = parse_schedule_objs_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
    #[test]
    fn parse_schedule_0303_test() -> anyhow::Result<()> {
        // load from file "0303_schedule_test.txt"
        let schedule_objs = std::fs::read_to_string("test_data/0303_schedule_test.txt")?;

        let res = parse_schedule_objs_groups(schedule_objs)?;

        println!("Parsed {} objects", res.len());

        Ok(())
    }
}