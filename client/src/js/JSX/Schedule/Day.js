import { makeLessons } from "../../Utils/Schedule/Day/makeLessons";
import { useSelector } from "react-redux";
import { DAYS } from "../../Utils/DAYS";
import { makeCalendarTime } from "../../Utils/handleTime";
import { scheduleString } from "../../Utils/Schedule/Day/scheduleString";

export function Day({daySchedule}) {
  const { active } = useSelector(s => s.active);
  const { fullNameEnabledValue } = useSelector(s => s.fullNameEnabled);
  const { planningData } = useSelector(s => s.planningData);
  const { scheduleDiffs } = useSelector(s => s.scheduleDiffs);
  const { weekNumber } = useSelector(s => s.date);

  const dayOfWeek = makeCalendarTime(daySchedule[0].date, DAYS)

  if (planningData && scheduleDiffs) {
    const lessons = makeLessons(daySchedule, fullNameEnabledValue, planningData, scheduleDiffs[weekNumber]);

    return (
      <div className="day">
        <div className="day__date">
          {active === 'schedule' ?
            dayOfWeek :
            dayOfWeek.slice(0, -5)
          }
          <div className="day__schedule-string">
            {scheduleString(daySchedule)}
          </div>
        </div>
        <div className="day__lessons">
          {lessons}
        </div>
      </div>
    );
  }
}
