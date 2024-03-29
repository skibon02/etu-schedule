export interface IAuditoriumReservation {
  auditorium_number?: string,
  time: number,
  week: string,
  week_day: string,
}

export interface ISubject {
  alien_id: number,
  title: string,
  short_title: string,
  subject_type: string,
  control_type?: string,
  department_id: number,
}

export interface ITeacher {
  id: number,
  name: string,
  surname: string,
  midname: string,
  initials: string,

  birthday: string,
  email?: string,
  group_id?: number,

  rank?: string,
  position?: string,
  degree?: string,
  work_departments: string[],

  is_department_dispatcher: boolean,
  is_department_head: boolean,
  is_student: boolean,
  is_worker: boolean,
}

export interface IScheduleObject {
  auditorium_reservation: IAuditoriumReservation,
  subject: ISubject,
  teachers: ITeacher[],
  id: number,
  time_link_id: number,
}

export interface IGroupSchedule {
  is_ready: boolean,
  actual_time: number,
  sched_objs: IScheduleObject[]
}

export interface IScheduleObjectExtended extends IScheduleObject {
  date: string;
}

export type parsedSchedule = (IScheduleObjectExtended[] | [null, string])[];

export interface IGroupClass {
  groupNumber: null | string,
  groupId: null | number,
  groupNumberIdStatus: 'idle' | 'pending' | 'done',
  groupSchedule: IGroupSchedule | null,
  parsedSchedule1: parsedSchedule | null,
  parsedSchedule2: parsedSchedule | null,
  groupScheduleStatus:  'idle' | 'pending' | 'done',
  groupList: Igroup[] | null,
  groupListStatus:  'idle' | 'pending' | 'done',
  schedulePlanning: IscheduleDiff | null,
  schedulePlanningStatus:  'idle' | 'pending' | 'done';
  scheduleDiffs: IscheduleDiffs | null,
  scheduleDiffsStatus:  'idle' | 'pending' | 'done';
  userNotes: IgetUserNotesResponse | null;
  userNotesStatus: 'idle' | 'pending' | 'done',
  groupNotes: IgetGroupNotesResponse | null;
  groupNotesStatus: 'idle' | 'pending' | 'done',
  schedulePlanningGETFetch(): void,
  scheduleDiffsGETFetch(): void,
  groupListGETFetch(): void,
  userNotesGETFetch(): void,
  groupNotesGETFetch(): void,
  reset(): void,
}

export interface ITeacherInfo {
  id: number;
  name: string;
  surname: string;
  midname: string;
}

export interface IUsableSchedule {
  title: string;
  subjectType: string;
  number?: string;
  teachers: ITeacherInfo[];
  time: number;
  weekDay: string;
  date: string;
  id: number;
  time_link_id: number;
}

export interface Igroup {
  group_id: number,
  number: string,
  studying_type: string,
  education_level: string,
  start_year: number,
  end_year: number,
  department_id: number,
  specialty_id: number,
  latest_schedule_merge_timestamp: number[] | null,
}

export interface IscheduleDiff {
  [key: number]: {
    is_new: boolean,
    auto_attendance_enabled: boolean,
  }
}

export interface IscheduleDiffs {
  [key: number]: IscheduleDiff
}


export interface IgetUserNotesResponse {
  weeks: Record<number, IUserNotesWeek>; // week number: {weekId: number, userNotes: {time_link_id: note} }
}

export interface IUserNotesWeek {
  week_id: number; // week number
  user_notes: Record<number, string>; // time_link_id: note
}

export interface IgetGroupNotesResponse {
  weeks: Record<number, IgroupNotesWeek>; // week number: {weekId: number, userNotes: {time_link_id: note} }
}

export interface IgroupNotesWeek {
  week_id: number; // week number
  group_notes: Record<number, string>; // time_link_id: note
}


