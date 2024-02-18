import Day from "../../TSX/Shedule/Day";
import EmptyDay from "../../TSX/Shedule/EmptyDay";
import { IScheduleObjectExtended } from "../../types/stores/GroupTypes";

export function makeWeek(weekSchedule: Array<IScheduleObjectExtended[] | [null, string]>) {
  let week = [];
  for (let i = 0; i < weekSchedule.length; i++) {
    if (weekSchedule[i][0] !== null) {
      const day = weekSchedule[i] as IScheduleObjectExtended[];
      week.push(
        <Day key={i} daySchedule={day} />
      )
    } else {
      const date = weekSchedule[i][1] as string;
      week.push(
        <EmptyDay key={i} date={date} />
      )
    }
  }
  return week;
}
