import { makeWeek } from "../../Utils/Schedule/Week/makeWeek";

export function Week({weekSchedule, weekNumber}) {
  const week = makeWeek(weekSchedule);

  console.log('Week Number is:');
  console.log(weekNumber);

  return (
    <div className="schedule">
      {/* <div>week number is {weekNumber}</div> */}
      {week}
    </div>
    )
}