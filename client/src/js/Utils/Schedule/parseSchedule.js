import { isEvenWeek, getWeekNumber } from "../handleTime";


const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function makeUsableSchedule(scheduleObject, fullNameEnabledValue) {

  const date = scheduleObject.date;
  const auditoriumReservation = scheduleObject.auditorium_reservation;
  const subject = scheduleObject.subject;

  let firstTeacher = scheduleObject.teacher; 
  let secondTeacher = scheduleObject.second_teacher;
  let thirdTeacher = scheduleObject.third_teacher;
  let fourthTeacher = scheduleObject.fourth_teacher;
  

  let title = subject.title;
  let shortTitle = subject.short_title;
  const subjectType = subject.subject_type;
  let titleWords = title.split(' ');
  for (let i = 0; i < titleWords.length; i++) {
    title =  titleWords[i].length > 16 ? shortTitle : title;
  }
  title = titleWords.length > 6 ? shortTitle : title
  if (fullNameEnabledValue === 'shorten') {
    title = shortTitle;
  }

  let teachers = [];
  firstTeacher = makeTeacher(firstTeacher, teachers);
  secondTeacher = makeTeacher(secondTeacher, teachers);
  thirdTeacher = makeTeacher(thirdTeacher, teachers);
  fourthTeacher = makeTeacher(fourthTeacher, teachers);

  const time = auditoriumReservation.time;
  const weekDay = auditoriumReservation.week_day;

  let number;
  if (auditoriumReservation !== null) {
    number = auditoriumReservation.auditorium_number;
  }

  return {
    title: title,
    subjectType: subjectType,
    number: number,
    teachers: teachers,
    time: time,
    weekDay: weekDay,
    date: date,
  }
}

function makeTeacher(teacher, teachers) {
  if (teacher !== null) {
    teachers.push({
      id: teacher.id, 
      name: teacher.name, 
      surname: teacher.surname, 
      midname: teacher.midname
    });
  }
}


// returns week -> array of sheduleObjects relevant to parity of current week
function parseWeek(scheduleObjects, weekParity) {
  return scheduleObjects.filter((scheduleObject) => 
    scheduleObject.auditorium_reservation.week === weekParity
  );
}


/*
  returns one day of week -> array of sorted (*) sheduleObjects 
  (*) firstly it sorts week to get sheduleObjects relevant to dayOfWeek
      secondly it sorts scheduleObjects in startTime order

  @param {array} week
  @param {string} dayOfWeek -> from WEEK_DAYS
  @param {object} date -> new Date() - current date
  @param {string} currentDayOfWeek -> from WEEK_DAYS

  @returns {array} -> array of days, each day contains number of scheduleObject
                      if day is empty -> i-th index will contain null
*/
function parseDays(week, dayOfWeek, date, currentDayOfWeek) {
  if (week.some((scheduleObject) => 
    scheduleObject.auditorium_reservation.week_day === dayOfWeek)) 
  {
     return week.
    filter((scheduleObject) => 
    scheduleObject.auditorium_reservation.week_day === dayOfWeek).
    map((day) => ({
      ...day,
      date: currentDayOfWeek !== 'SUN' ?
        new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek))) :
        new Date(date.getTime() - (24 * 60 * 60 * 1000) * (7 - WEEK_DAYS.indexOf(dayOfWeek)))
    })).
    sort(sortScheduleByLesson);
  } else {
    return [null, currentDayOfWeek !== 'SUN' ?
    new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek))) :
    new Date(date.getTime() - (24 * 60 * 60 * 1000) * (7 - WEEK_DAYS.indexOf(dayOfWeek)))];
  }
}

function sortScheduleByLesson(scheduleObjectI, scheduleObjectJ) {
  return (
      +scheduleObjectI.auditorium_reservation.time 
      - 
      +scheduleObjectJ.auditorium_reservation.time
    );
}

export default function makeSchedule(scheduleObjects, date) {

  let parity = isEvenWeek(date);
  let currentDayOfWeek = WEEK_DAYS[date.getDay()];

  const week = parseWeek(scheduleObjects.sched_objs, parity); // -> arr contain arr

  let weekSchedule = [];
  
  for (let i = 1; i < 7; i++) {
    weekSchedule.push(parseDays(week, WEEK_DAYS[i], date, currentDayOfWeek));
  }

  console.log('week schedule from parseSchedule\n', weekSchedule);
  
  return weekSchedule;
}




