import { makeUsableSchedule } from "../parseSchedule";

export function makeLessons(daySchedule, Subject, active) {
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i]);
  
    lessons.push(
      <Subject 
        key={daySchedule[i].id} 
        subjectData={usableSchedule} 
        orderNumber={usableSchedule.time} 
        active={active} />
    )
  }
  return lessons;
}