import { makeWeek } from "../../Utils/Schedule/Week/makeWeek";

export default function Week({weekSchedule}) {
  const week = makeWeek(weekSchedule);

  return (
    <div className="schedule">
      {week}
    </div>
    )
}