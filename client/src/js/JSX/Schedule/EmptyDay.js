import { useSelector } from "react-redux";
import { makeCalendarTime } from "../../Utils/handleTime";
import { DAYS } from "../../Utils/DAYS";

export default function EmptyDay({date}) {
  const {active} = useSelector(s => s.active);

  return (
    <>
    <div className="day">
      <div className="day__date">
        {active === 'planning' ? 
        makeCalendarTime(date, DAYS).slice(0, -5)
        :
        makeCalendarTime(date, DAYS)
        }
        <div className="day__schedule-string">
          0 пар
        </div>
      </div>
      <div className="day__lessons">
        <div className='day__empty'>
          <div className="day__empty-text">
            so empty...
          </div>
        </div>
      </div>
    </div>
    </>
  )
}