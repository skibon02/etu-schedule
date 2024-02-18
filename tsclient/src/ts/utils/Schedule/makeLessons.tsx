import Subject from "../../TSX/Shedule/Subject";
import { IScheduleObjectExtended, IscheduleDiff } from "../../types/stores/GroupTypes";
import { makeUsableSchedule } from "./parseSchedule";

export function makeLessons(daySchedule: IScheduleObjectExtended[], fullNameEnabledValue: string, planningData: IscheduleDiff | null, scheduleDiffs: IscheduleDiff | null) {
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i], fullNameEnabledValue);
    let linkId = usableSchedule.time_link_id;
    let schedValue = null;
    if (scheduleDiffs && scheduleDiffs.hasOwnProperty(linkId)) {
      schedValue = scheduleDiffs[linkId].auto_attendance_enabled;
    }
  
    lessons.push(
      <Subject
        key={daySchedule[i].id} 
        subjectData={usableSchedule} 
        orderNumber={usableSchedule.time}
        planning_time_link_id_value={planningData![linkId].auto_attendance_enabled}
        schedule_diffs_value={schedValue} />
    )
  }
  return lessons;
}