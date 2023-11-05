import { isEvenWeek, getWeekNumber } from "../handleTime";


const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function makeUsableSchedule(scheduleObject) {

  const lesson = scheduleObject.lesson;

  const date = scheduleObject.date;

  const auditoriumReservation = lesson.auditoriumReservation;
  const subject = lesson.subject;
  const firstTeacher = lesson.teacher; 
  const secondTeacher = lesson.secondTeacher;
  
  const reservationTime = auditoriumReservation.reservationTime;
  const auditorium = auditoriumReservation.auditorium;

  let title = subject.title;
  let shortTitle = subject.shortTitle;
  const subjectType = subject.subjectType;
  let titleWords = title.split(' ');
  for (let i = 0; i < titleWords.length; i++) {
    title =  titleWords[i].length > 16 ? shortTitle : title;
  }
  title = titleWords.length > 6 ? shortTitle : title
  if (window.localStorage.getItem('fullNameEnabledValue') === 'short') {
    title = shortTitle;
  }

  let teachers = [];
  let firstTeacherId;
  let firstTeacherName;
  let firstTeacherSurname;
  let firstTeacherMidame;
  if (firstTeacher !== null) {
    firstTeacherId = firstTeacher.id;
    firstTeacherName = firstTeacher.name;
    firstTeacherSurname = firstTeacher.surname;
    firstTeacherMidame = firstTeacher.midname;
    teachers.push({id: firstTeacherId, name: firstTeacherName, surname: firstTeacherSurname, midname: firstTeacherMidame});
  }

  let secondTeacherId;
  let secondTeacherName;
  let secondTeacherSurname;
  let secondTeacherMidame;
  if (secondTeacher !== null) {
    secondTeacherId = secondTeacher.id;
    secondTeacherName = secondTeacher.name;
    secondTeacherSurname = secondTeacher.surname;
    secondTeacherMidame = secondTeacher.midname;
    teachers.push({id: secondTeacherId, name: secondTeacherName, surname: secondTeacherSurname, midname: secondTeacherMidame});
  }

  const startTime = reservationTime.startTime;
  const endTime = reservationTime.endTime;
  const weekDay = reservationTime.weekDay;

  let displayName;
  let number;
  if (auditorium !== null) {
    displayName = auditorium.displayName;
    number = auditorium.number;
  }

  return {
    title: title,
    subjectType: subjectType,
    displayName: displayName,
    number: number,
    teachers: teachers,
    startIndex: startTime % 10,
    endIndex: endTime % 10,
    weekDay: weekDay,
    date: date,
  }
  

}


// returns week -> array of sheduleObjects relevant to parity of current week
function parseWeek(scheduleObjects, weekParity) {
  return scheduleObjects.filter((scheduleObject) => 
    scheduleObject.lesson.auditoriumReservation.reservationTime.week === weekParity
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
  scheduleObject.lesson.auditoriumReservation.reservationTime.weekDay === dayOfWeek)) 
  {

    return week.
    filter((scheduleObject) => 
    scheduleObject.lesson.auditoriumReservation.reservationTime.weekDay === dayOfWeek).
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
      +scheduleObjectI.lesson.auditoriumReservation.reservationTime.startTime 
      - 
      +scheduleObjectJ.lesson.auditoriumReservation.reservationTime.startTime
    );
}

export default function makeSchedule(scheduleObjects, date) {
  let parity = isEvenWeek(date);
  let currentDayOfWeek = WEEK_DAYS[date.getDay()];

  const week = parseWeek(scheduleObjects, parity); // -> arr contain arr

  let weekSchedule = [];
  
  for (let i = 1; i < 7; i++) {
    weekSchedule.push(parseDays(week, WEEK_DAYS[i], date, currentDayOfWeek));
  }
  
  return weekSchedule;
}




