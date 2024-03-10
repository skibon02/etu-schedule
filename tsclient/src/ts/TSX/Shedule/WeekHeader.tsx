import { useState, useEffect } from "react";
import { weekHeaderTime } from "../../utils/Schedule/utils";
import { groupStore } from "../../stores/groupStore";
import { dateStore } from "../../stores/dateStore";
import { activeStore } from "../../stores/activeStore";
import { observer } from "mobx-react";
import { GroupDateTokenService } from "../../services/GroupDateTokenService";

function WeekHeader({weekParity}: {weekParity: string | null}) {

  const [clock, setClock] = useState(weekHeaderTime(new Date()));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClock(weekHeaderTime(new Date()));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <div className="schedule-info-container">
      <div className='schedule__info schedule-info'>
        <div className='schedule-info__group schedule-info__item'>Группа: {groupStore.groupNumber}</div>
        {activeStore.active === 'schedule' && <div className='schedule-info__date schedule-info__item'>Дата: {clock[0]}. Время: {clock[1]}</div>}
        <div className='schedule-info__week-parity schedule-info__item'>
          {weekParity === null ? 
            `Неделя: ${dateStore.weekParity}` 
            :
            `Неделя: ${weekParity}`
          }
        </div>
      </div>
      {activeStore.active === 'planning' &&
      <div className="planning-all-mark planning-all-mark__container">
        <div role="button" onClick={() => GroupDateTokenService.schedulePlanningSETAllFetch(false)} 
          className="planning-all-mark__button planning-all-mark__button_red">
          Не посещать все пары
        </div>
        <div role="button" onClick={() => GroupDateTokenService.schedulePlanningSETAllFetch(true)} 
          className="planning-all-mark__button planning-all-mark__button_green">
          Посещать все пары
        </div>
      </div>
      }
    </div>
  )
}

export default observer(WeekHeader);
