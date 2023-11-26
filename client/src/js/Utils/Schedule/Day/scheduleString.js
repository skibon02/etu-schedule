import { knowSubjectTime } from "../../handleTime";

function formatTime(hour, minute) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function getLessonTimes(lessonNumber) {
  let [st, endt, deadl] = knowSubjectTime(lessonNumber, new Date());
  
  return [formatTime(st.getHours(), st.getMinutes()), formatTime(endt.getHours(), endt.getMinutes())];
}

function scheduleString(l) {

  let lessons = [l[0]];
  for (let i = 1; i < l.length; i++) {
    if (l[i].auditorium_reservation.time !== l[i - 1].auditorium_reservation.time) {
      lessons.push(l[i]);
    }
  }

  let intervals = [];
  let currentInterval = [lessons[0].auditorium_reservation.time, lessons[0].auditorium_reservation.time];

  for (let i = 1; i < lessons.length; i++) {
      if (lessons[i].auditorium_reservation.time === currentInterval[1] + 1) {
          currentInterval[1] = lessons[i].auditorium_reservation.time;
      } else {
          intervals.push(currentInterval);
          currentInterval = [lessons[i].auditorium_reservation.time, lessons[i].auditorium_reservation.time];
      }
  }
  intervals.push(currentInterval);

  const timeStrings = intervals.map(interval => {
      const [startTime] = getLessonTimes(interval[0]);
      const [, endTime] = getLessonTimes(interval[1]);
      return `${startTime} до ${endTime}`;
  });

  return ` ${lessons.length} пар${lessons.length === 1 ? 'а' : lessons.length === 2 || lessons.length === 3 || lessons.length === 4  ? 'ы' : ''} с ${timeStrings.join(' и с ')}`;
}


export {scheduleString}
