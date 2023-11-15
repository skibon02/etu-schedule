import { makeUsableSchedule } from "../parseSchedule";
import { Subject } from "../../../JSX/Schedule/Subject";

export function makeLessons(daySchedule, fullNameEnabledValue) {
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i], fullNameEnabledValue);
  
    lessons.push(
      <Subject 
        key={daySchedule[i].id} 
        subjectData={usableSchedule} 
        orderNumber={usableSchedule.time} />
    )
  }
  return lessons;
}