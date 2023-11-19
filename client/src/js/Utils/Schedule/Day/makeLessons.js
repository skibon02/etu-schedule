import { makeUsableSchedule } from "../parseSchedule";
import { Subject } from "../../../JSX/Schedule/Subject";

export function makeLessons(daySchedule, fullNameEnabledValue, planningData) {
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i], fullNameEnabledValue);
  
    lessons.push(
      <Subject 
        key={daySchedule[i].id} 
        subjectData={usableSchedule} 
        orderNumber={usableSchedule.time}
        planning_time_link_id_value={planningData[usableSchedule.time_link_id]} />
    )
  }
  return lessons;
}