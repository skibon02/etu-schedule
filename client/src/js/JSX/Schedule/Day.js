import { makeLessons } from "../../Utils/Schedule/Day/makeLessons";
import { useSelector } from "react-redux";
import { DAYS } from "../../Utils/DAYS";
import { makeCalendarTime } from "../../Utils/handleTime";

export function Day({daySchedule}) {
  const {active} = useSelector(s => s.active);
  const {fullNameEnabledValue, fullNameEnabledLabel} = useSelector(s => s.fullNameEnabled);
  const {planningData, planningDataStatus, planningDataError} = useSelector(s => s.planningData);

  const dayOfWeek = makeCalendarTime(daySchedule[0].date, DAYS)

  if (planningData) {
    const lessons = makeLessons(daySchedule, fullNameEnabledValue, planningData);

    return (
      <div className="day">
        <div className="day__date">
          {active === 'schedule' ?
            dayOfWeek :
            dayOfWeek.slice(0, -5)
          }
        </div>
        <div className="day__lessons">
          {lessons}
        </div>
      </div>
    );
  }
}
