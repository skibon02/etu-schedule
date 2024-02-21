import { dateStore } from "../../stores/dateStore";
import { IUsableSchedule, IScheduleObjectExtended, ITeacherInfo, ITeacher, IScheduleObject, IGroupSchedule } from "../../types/stores/GroupTypes";

export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function makeUsableSchedule(scheduleObject: IScheduleObjectExtended, fullNameEnabledValue: string): IUsableSchedule {
  const date: string = scheduleObject.date;
  const auditoriumReservation = scheduleObject.auditorium_reservation;
  const subject = scheduleObject.subject;
  const id = scheduleObject.id;
  const time_link_id = scheduleObject.time_link_id;

  let firstTeacher = scheduleObject.teacher; 
  let secondTeacher = scheduleObject.second_teacher;
  let thirdTeacher = scheduleObject.third_teacher;
  let fourthTeacher = scheduleObject.fourth_teacher;

  let title = subject.title;
  let shortTitle = subject.short_title;
  const subjectType = subject.subject_type;
  let titleWords = title.split(' ');
  for (let i = 0; i < titleWords.length; i++) {
    title = titleWords[i].length > 16 ? shortTitle : title;
  }
  title = titleWords.length > 4 ? shortTitle : title;
  if (fullNameEnabledValue === 'shorten') {
    title = shortTitle;
  }

  let teachers: ITeacherInfo[] = [];
  makeTeacher(firstTeacher, teachers);
  makeTeacher(secondTeacher, teachers);
  makeTeacher(thirdTeacher, teachers);
  makeTeacher(fourthTeacher, teachers);

  const time = auditoriumReservation.time;
  const weekDay = auditoriumReservation.week_day;

  let number: string | undefined;
  if (auditoriumReservation !== null) {
    number = auditoriumReservation.auditorium_number;
  }

  return {
    title,
    subjectType,
    number,
    teachers,
    time,
    weekDay,
    date,
    id,
    time_link_id,
  };
}

function makeTeacher(teacher: ITeacher | undefined, teachers: ITeacherInfo[]): void {
  if (teacher) {
    teachers.push({
      id: teacher.id, 
      name: teacher.name, 
      surname: teacher.surname, 
      midname: teacher.midname
    });
  }
}

function parseWeek(scheduleObjects: IScheduleObject[], weekParity: string): IScheduleObject[] {
  return scheduleObjects.filter((scheduleObject) => 
    scheduleObject.auditorium_reservation.week === weekParity
  );
}

function parseDays(week: IScheduleObject[], dayOfWeek: string, date: Date, currentDayOfWeek: string): IScheduleObjectExtended[] | [null, string] {
  if (week.some((scheduleObject) => 
    scheduleObject.auditorium_reservation.week_day === dayOfWeek)) {
    return week
      .filter((scheduleObject) => 
        scheduleObject.auditorium_reservation.week_day === dayOfWeek)
      .map((day): IScheduleObjectExtended => ({
        ...day,
        date: currentDayOfWeek !== 'SUN' ?
          (new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek)))).toISOString() :
          (new Date(date.getTime() - (24 * 60 * 60 * 1000) * (7 - WEEK_DAYS.indexOf(dayOfWeek)))).toISOString()
      }))
      .sort(sortScheduleByLesson);
  } else {
    const currentDate: string = currentDayOfWeek !== 'SUN' ?
      (new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek)))).toISOString() :
      (new Date(date.getTime() - (24 * 60 * 60 * 1000) * (7 - WEEK_DAYS.indexOf(dayOfWeek)))).toISOString();
    return [null, currentDate];
  }
}

function sortScheduleByLesson(scheduleObjectI: IScheduleObject, scheduleObjectJ: IScheduleObject): number {
  return (
    +scheduleObjectI.auditorium_reservation.time 
    - 
    +scheduleObjectJ.auditorium_reservation.time
  );
}

export function makeSchedule(groupSchedule: IGroupSchedule, date: Date): Array<IScheduleObjectExtended[] | [null, string]> {
  let parity = dateStore.weekParity;
  let currentDayOfWeek = WEEK_DAYS[date.getDay()];

  const week = parseWeek(groupSchedule.sched_objs, parity); // week[] -> 6 * day[] -> schedObjs{}

  let weekSchedule: Array<IScheduleObjectExtended[] | [null, string]> = [];
  
  for (let i = 1; i < 7; i++) {
    const daySchedule = parseDays(week, WEEK_DAYS[i], date, currentDayOfWeek);
    weekSchedule.push(daySchedule);
  }

  // If you need to include Sunday:
  // weekSchedule.push(parseDays(week, WEEK_DAYS[0], date, currentDayOfWeek));

  console.log('week Schedule is:\n', weekSchedule);
  return weekSchedule;
}