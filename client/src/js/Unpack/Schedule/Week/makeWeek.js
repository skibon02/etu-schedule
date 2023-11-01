import { makeCalendarTime } from "../../../Utils/handleTime";

export function makeWeek(weekSchedule, Day, DAYS, active) {
  let week = [];
  for (let i = 0; i < weekSchedule.length; i++) {
    if (weekSchedule[i][0] !== null) {
      week.push(<Day key={i} daySchedule={weekSchedule[i]} active={active}  />)
    } else {
      week.push(
        <div key={i} className="day">
          <div className="day__date">
            {active === 'planning' ? 
            makeCalendarTime(weekSchedule[i][1], DAYS).slice(0, -5)
            :
            makeCalendarTime(weekSchedule[i][1], DAYS)
            }
          </div>
          <div className="day__lessons">
            <div className='day__empty'>
              <div className="day__empty-text">
                so empty...
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
  return week;
}