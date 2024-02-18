function knowSubjectTime(i, date) {
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

function makeClockTime(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return formattedTime;
}

function makeCalendarTime(date, days) {
  date = (new Date(date));
  return `${days[date.getDay()]} ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

function getWeekNumber(start="2024-02-05T00:00:00.000Z", date) {
  const today = new Date(date);
  const startDate = new Date(start);

  const daysDiff = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
  const weeksDiff = Math.floor(daysDiff / 7);

  return weeksDiff;
}


function isEvenWeek(date) {
  const weeksDiff = getWeekNumber(undefined, date);

  if (weeksDiff % 2 === 0) {
    return '1';
  } else {
    return '2';
  }
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
