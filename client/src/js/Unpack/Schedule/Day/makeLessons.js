import { makeUsableSchedule } from "../../../Utils/Schedule/parseSchedule";

export function makeLessons(daySchedule, Subject) {
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i]);
  
    for (let j = usableSchedule.startIndex; j <= usableSchedule.endIndex; j++) {
      lessons.push(
        <Subject 
          key={daySchedule[i].id + ' ' + j.toString()} 
          subjectData={usableSchedule} 
          orderNumber={j} 
        />
      );
    }
  }
  return lessons;
}