import { useState } from "react";
import makeSchedule from "../../Utils/Schedule/parseSchedule"
import { PlanningButton } from "./PlanningButton"
import NoSchedule from "../Schedule/NoSchedule";
import { Week } from "../Schedule/Week";
import { WeekHeader } from "../Schedule/WeekHeader";
import { isEvenWeek } from "../../Utils/handleTime";
import { useSelector } from "react-redux";


export default function Planning() {
  const {active} = useSelector(s => s.active);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { groupSchedule, groupScheduleStatus, groupScheduleError } = useSelector(s => s.groupSchedule);

  const [weekParity, setWeekParity] = useState(isEvenWeek(new Date));
  if (!groupSchedule) {
    return (
      <NoSchedule groupNumber={groupNumber} />
    )
  }
  
  if (!groupSchedule.is_ready) {
    return (
      <NoSchedule groupNumber={-1} />
    )
  }

  const weekSchedule1 = makeSchedule(groupSchedule, new Date());
  const weekSchedule2 = makeSchedule(groupSchedule, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));

  return (
    <>  
    <div className='planning-header'>
      <PlanningButton
        parity={'1'}
        selectedParity={weekParity}
        text={'Первая неделя'}
        handleClick={() => setWeekParity('1')} />
      <PlanningButton
        parity={'2'}
        selectedParity={weekParity}
        text={'Вторая неделя'}
        handleClick={() => setWeekParity('2')} />
    </div>

    <div className="planning-thead">
      <div className="planning-thead__body">
        <div className="planning-thead__lesson">
          Предмет
        </div>
        <div className="planning-thead__attendance">
          Авто-посещение
        </div>
      </div>
    </div>
    
    {active === 'planning' && <div className="under-planning-thead-box"></div>}

    {weekParity === '1' ?
    <>
    <div className='schedule-info-container'>
      <WeekHeader weekParity={weekParity} />
    </div>
    <Week
      weekSchedule={weekSchedule1} />
    </>
    :
    <>
    <div className='schedule-info-container'>
      <WeekHeader weekParity={weekParity} />
    </div>
    <Week
      weekSchedule={weekSchedule2} />
    </>
    }

      {active === 'planning' && <div className="under-planning-thead-box-mobile"></div>}
    </>
  )
}