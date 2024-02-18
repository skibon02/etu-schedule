import EmptyDay from "../../../JSX/Schedule/EmptyDay";
import { Day } from "../../../JSX/Schedule/Day";

export function makeWeek(weekSchedule) {
  let week = [];
  for (let i = 0; i < weekSchedule.length; i++) {
    if (weekSchedule[i][0] !== null) {
      week.push(
        <Day key={i} daySchedule={weekSchedule[i]} />
      )
    } else {
      week.push(
        <EmptyDay key={i} date={weekSchedule[i][1]} />
      )
    }
  }
  return week;
}
