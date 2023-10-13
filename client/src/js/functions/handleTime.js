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

  const title = subject.title;
  const subjectType = subject.subjectType;

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
    lesson: {
      title: title,
      subjectType: subjectType,
      displayName: displayName,
      number: number,
    },
    teachers: teachers,
    date: {
      startIndex: startTime % 10,
      endIndex: endTime % 10,
      weekDay: weekDay,
      date: date,
    },
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
      date: new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek)))
    })).
    sort(sortScheduleByLesson);
  } else {
    return [null, new Date(date.getTime() - (24 * 60 * 60 * 1000) * (WEEK_DAYS.indexOf(currentDayOfWeek) - WEEK_DAYS.indexOf(dayOfWeek)))];
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


function isEvenWeek(date) {
  const today = new Date(date);
  const septemberFirst = new Date(today.getFullYear(), 7, 28); // September is month 8 (0-based index).

  const daysDiff = Math.floor((today - septemberFirst) / (24 * 60 * 60 * 1000));
  const weeksDiff = Math.floor(daysDiff / 7);


  if (weeksDiff % 2 === 0) {
    console.log('first');
    return '1';
  } else {
    console.log('second');
    return '2'
  }
}

export function makeClockTime(date) {

  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return formattedTime;
}

export function makeCalendarTime(date, days) {
  return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

