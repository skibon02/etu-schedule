import { useState } from "react";
import Schedule from "../Schedule/Schedule";
import makeSchedule from "../../Utils/Schedule/parseSchedule"
import { PlanningButton } from "./PlanningButton"
import NoSchedule from "../Schedule/NoSchedule";
import { isEvenWeek } from "../../Utils/handleTime";


export default function Planning({groupSchedule, groupNumber, active}) {
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

  const weekSchedule1 = makeSchedule(groupSchedule, new Date('2023-09-01'));
  const weekSchedule2 = makeSchedule(groupSchedule, new Date(new Date('2023-09-01').getTime() + 1000 * 60 * 60 * 24 * 7));

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

    {weekParity === '1' &&
    <Schedule 
      groupSchedule={weekSchedule1} 
      groupNumber={groupNumber} 
      active={active} 
      date={new Date('2023-09-01')} />}
    {weekParity === '2' &&
    <Schedule 
      groupSchedule={weekSchedule2} 
      groupNumber={groupNumber} 
      active={active} 
      date={new Date(new Date('2023-09-01').getTime() + 1000 * 60 * 60 * 24 * 7)} />}

      {active === 'planning' && <div className="under-planning-thead-box-mobile"></div>}
    </>
  )
}