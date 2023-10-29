// !!! @param date passing as new Date(date)
function knowSubjectTime(i, date) {
  date.setSeconds(0);
  date.setMilliseconds(0);

  let startTime = new Date(date);
  let endTime = new Date(date);
  let checkInDeadLine = new Date(date);

  switch (i) {
    case 0:
      startTime.setHours(8);
      startTime.setMinutes(0);

      endTime.setHours(9);
      endTime.setMinutes(30);
      
      checkInDeadLine.setHours(9);
      checkInDeadLine.setMinutes(45);
      break;
    case 1:
      startTime.setHours(9);
      startTime.setMinutes(50);

      endTime.setHours(11);
      endTime.setMinutes(20);
      
      checkInDeadLine.setHours(11);
      checkInDeadLine.setMinutes(35);
      break;
    case 2:
      startTime.setHours(11);
      startTime.setMinutes(40);

      endTime.setHours(13);
      endTime.setMinutes(10);
      
      checkInDeadLine.setHours(13);
      checkInDeadLine.setMinutes(25);
      break;
    case 3:
      startTime.setHours(13);
      startTime.setMinutes(40);

      endTime.setHours(15);
      endTime.setMinutes(10);
      
      checkInDeadLine.setHours(15);
      checkInDeadLine.setMinutes(25);
      break;
    case 4:
      startTime.setHours(15);
      startTime.setMinutes(30);

      endTime.setHours(17);
      endTime.setMinutes(0);
      
      checkInDeadLine.setHours(17);
      checkInDeadLine.setMinutes(15);
      break;
    case 5:
      startTime.setHours(17);
      startTime.setMinutes(20);

      endTime.setHours(18);
      endTime.setMinutes(50);
      
      checkInDeadLine.setHours(19);
      checkInDeadLine.setMinutes(5);
      break;
    case 6:
      startTime.setHours(19);
      startTime.setMinutes(5);

      endTime.setHours(20);
      endTime.setMinutes(35);
      
      checkInDeadLine.setHours(20);
      checkInDeadLine.setMinutes(20);
      break;
    case 7:
      startTime.setHours(20);
      startTime.setMinutes(50);

      endTime.setHours(22);
      endTime.setMinutes(20);
      
      checkInDeadLine.setHours(22);
      checkInDeadLine.setMinutes(35);
      break;
  }

  return [startTime, endTime, checkInDeadLine]
}

function makeClockTime(date) {

  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return formattedTime;
}

function makeCalendarTime(date, days) {
  return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

function isEvenWeek(date) {
  const today = new Date(date);
  const firstWeek = new Date(today.getFullYear(), 7, 27); // (month 0-based index) 28 aug.

  const daysDiff = Math.floor((today - firstWeek) / (24 * 60 * 60 * 1000));
  const weeksDiff = Math.floor(daysDiff / 7);


  if (weeksDiff % 2 === 0) {
    return '1';
  } else {
    return '2';
  }
}

function getWeekNumber(date) {
  const today = new Date(date);
  const firstWeek = new Date(today.getFullYear(), 7, 27); // (month 0-based index) 28 aug.

  const daysDiff = Math.floor((today - firstWeek) / (24 * 60 * 60 * 1000));
  const weeksDiff = Math.floor(daysDiff / 7);

  return weeksDiff
}

function weekHeaderTime(date) {
  const calendarDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return [`${calendarDate}`, `${hours}:${minutes}:${seconds}`];
}

export {
  knowSubjectTime, 
  isEvenWeek,
  makeCalendarTime,
  makeClockTime,
  weekHeaderTime,
  getWeekNumber
}
