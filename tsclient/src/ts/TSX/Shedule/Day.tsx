import { groupStore } from "../../stores/groupStore";
import { userDataStore } from "../../stores/userDataStore";
import { dateStore } from "../../stores/dateStore";
import { activeStore } from "../../stores/activeStore";
import { IScheduleObjectExtended } from "../../types/stores/GroupTypes";
import { makeCalendarTime, scheduleString } from "../../utils/Schedule/utils";
import { makeLessons } from "../../utils/Schedule/makeLessons";
import { observer } from "mobx-react";

function Day({daySchedule}: {daySchedule: IScheduleObjectExtended[]}) {

  const dayOfWeek = makeCalendarTime(daySchedule[0].date)

  const lessons = makeLessons(
    daySchedule, 
    userDataStore.fullNameEnabled.value, 
    groupStore.schedulePlanning, 
    groupStore.scheduleDiffs![dateStore.weekNumber]
  );

  return (
    <div className="day">
      <div className="day__date">
        {activeStore.active === 'schedule' ?
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

export default observer(Day);
