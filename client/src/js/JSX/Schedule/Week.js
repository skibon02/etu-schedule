import { Day } from "./Day";
import { DAYS } from "../../Utils/DAYS";
import { makeWeek } from "../../Unpack/Schedule/Week/makeWeek";

export function Week({weekSchedule, weekNumber, active}) {
  const week = makeWeek(weekSchedule, Day, DAYS, active);

  console.log('Week Number is:');
  console.log(weekNumber);

  return (
    <div className="schedule">
      {/* <div>week number is {weekNumber}</div> */}
      {week}
    </div>
    )
}