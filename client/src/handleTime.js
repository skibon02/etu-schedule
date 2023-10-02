export function getSortedWeekSchedule(schedule) {
  const currentDate = new Date();
  const currentDayOfWeek = currentDate.getDay();
  const sundayDate = new Date(currentDate);
  sundayDate.setDate(currentDate.getDate() - currentDayOfWeek);
  const mondayDate = new Date(sundayDate);
  mondayDate.setDate(sundayDate.getDate() + 1);
  const weekStartDate = mondayDate.getDate();

  const unsortedWeekSchedule = schedule.filter(d => {
    let date = new Date(d.start).getDate();
    return weekStartDate <= date && date <= weekStartDate + 6;
  });

  let sortedWeekSchedule = [];
  for (let i = weekStartDate; i < weekStartDate + 6; i++) {
    let daySchedule = unsortedWeekSchedule.filter(d => {
      let date = new Date(d.start).getDate();
      return date === i;
    });
    sortedWeekSchedule.push(daySchedule);
  }

  return sortedWeekSchedule;
}


export function getLessonTime(start, end) {
  let date = new Date(start);
  let hours = date.getHours().toString();
  let minutes = date.getMinutes().toString(); 
  minutes = minutes.length == 1 ? minutes + '0' : minutes;
  let lessonStart = `${hours}:${minutes}`;
  
  date = new Date(end);
  hours = date.getHours().toString();
  minutes = date.getMinutes().toString(); 
  minutes = minutes.length == 1 ? minutes + '0' : minutes;
  let lessonEnd = `${hours}:${minutes}`;

  return [lessonStart, lessonEnd];

}

export function formatDate(dateString) {
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const date = new Date(dateString);
  
  const dayOfWeek = daysOfWeek[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  
  return `${dayOfWeek}, ${day}.${month}`;
}


