import { IScheduleObjectExtended, ITeacherInfo } from '../../types/stores/GroupTypes';
import { activeStore } from '../../stores/activeStore';
import GPSLIGHT from '../../../icons/gpslite.svg'
import GPS from '../../../icons/location-pin-svgrepo-com.svg'
export const RU_DAYS = ["Воскресенье", 'Понедельник', 'Вторник', 'Среда', "Четверг", "Пятница", "Суббота"]

function makeTeachers(teachers: ITeacherInfo[]) {
  let teachersArr = []
  for (let i = 0; i < teachers.length; i++) {
    let teacher = teachers[i];
    teachersArr.push(
      <div key={teacher.id} className="lesson__teacher">
        {teacher.surname} {teacher.name} {teacher.midname}
      </div>
    );
  }
  return teachersArr;
}

function knowSubjectTime(i: number, date: Date) {
  date.setSeconds(0);
  date.setMilliseconds(0);

  const timeIntervals = [
    { start: [8, 0], end: [9, 30], checkIn: [9, 45] },
    { start: [9, 50], end: [11, 20], checkIn: [11, 35] },
    { start: [11, 40], end: [13, 10], checkIn: [13, 25] },
    { start: [13, 40], end: [15, 10], checkIn: [15, 25] },
    { start: [15, 30], end: [17, 0], checkIn: [17, 15] },
    { start: [17, 20], end: [18, 50], checkIn: [19, 5] },
    { start: [19, 5], end: [20, 35], checkIn: [20, 50] },
    { start: [20, 50], end: [22, 20], checkIn: [22, 35] },
  ];
  
  const interval = timeIntervals[i];

  const startTime = new Date(date);
  startTime.setHours(interval.start[0], interval.start[1]);

  const endTime = new Date(date);
  endTime.setHours(interval.end[0], interval.end[1]);

  const checkInDeadLine = new Date(date);
  checkInDeadLine.setHours(interval.checkIn[0], interval.checkIn[1]);

  return [startTime, endTime, checkInDeadLine];
}

function makeRooms(roomStr: string | undefined, isDead: boolean): JSX.Element | null {
  if (!roomStr) {
    return null;
  }
  const roomArr = roomStr.replace(/,/g, '').split(' ');
  let roomHTML = [];
  for (let i = 0; i < roomArr.length; i++) {
    roomHTML.push(
      <div key={roomArr[i]} className='lesson-type-room__room'>
        <img 
          draggable={false} 
          className='lesson-type-room__image' 
          src={activeStore.active === 'schedule' && isDead ? GPSLIGHT : GPS} /> 
        <div className='lesson-type-room__text'>
          {roomArr[i]}
        </div>
      </div>
    )
  }

  return (
    <div className='lesson-type-room__rooms'>
      {roomHTML}
    </div>
  )
}

function checkTimeAndSetTheme(checkInDeadline: Date): boolean {
  const currentTime = new Date();
  return currentTime > checkInDeadline;
}

function makeClockTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return formattedTime;
}

function makeCalendarTime(date: string) {
  const newDate = (new Date(date));
  return `${RU_DAYS[newDate.getDay()]} ${newDate.getDate().toString().padStart(2, '0')}.${(newDate.getMonth() + 1).toString().padStart(2, '0')}`
}

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function getLessonTimes(lessonNumber: number) {
  let [st, endt, deadl] = knowSubjectTime(lessonNumber, new Date());
  
  return [formatTime(st.getHours(), st.getMinutes()), formatTime(endt.getHours(), endt.getMinutes())];
}

function scheduleString(l: IScheduleObjectExtended[]) {

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

function weekHeaderTime(date: Date) {
  const calendarDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return [`${calendarDate}`, `${hours}:${minutes}:${seconds}`];
}

function truncateString(str: string, pos: number): string {
  let result = extractTextFromHtml(str);
  if (result.length > pos) {
    return result.substring(0, pos - 3) + "...";
  } else {
    return result;
  }
}

function extractTextFromHtml(htmlString: string) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  
  function recursiveExtract(node: Node) {
    let text = '';
    
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child instanceof HTMLElement) {
        if (['P', 'DIV', 'BR'].includes(child.tagName)) {
          text += ' ' + recursiveExtract(child) + ' ';
        } else {
          text += recursiveExtract(child);
        }
      }
    }

    return text;
  }

  return recursiveExtract(tempDiv).trim();
}

export {
  makeTeachers,
  knowSubjectTime,
  makeRooms,
  checkTimeAndSetTheme,
  makeClockTime,
  makeCalendarTime,
  scheduleString,
  weekHeaderTime,
  truncateString,
}
