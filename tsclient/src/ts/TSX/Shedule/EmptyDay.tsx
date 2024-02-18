import { observer } from "mobx-react";
import { activeStore } from "../../stores/activeStore";
import { makeCalendarTime } from "../../utils/Schedule/utils";

function EmptyDay({date}: {date: string}) {

  return (
    <>
    <div className="day">
      <div className="day__date">
        {activeStore.active === 'planning' ? 
        makeCalendarTime(date).slice(0, -5)
        :
        makeCalendarTime(date)
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

export default observer(EmptyDay);
