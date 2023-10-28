import { makeLessons } from "../../Unpack/Schedule/Day/makeLessons";
import { Subject } from "./Subject";
import { DAYS } from "../../Utils/DAYS";
import { makeCalendarTime } from "../../Utils/handleTime";


export function Day({daySchedule}) {
  const dayOfWeek = makeCalendarTime(daySchedule[0].date, DAYS)

  const lessons = makeLessons(daySchedule, Subject);

  return (
    <div className="day">
      <div className="day__date">
        {dayOfWeek}
      </div>
      <div className="day__lessons">
        {lessons}
      </div>
    </div>
  )
}