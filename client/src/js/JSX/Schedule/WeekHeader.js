import { useDispatch, useSelector } from "react-redux";
import { weekHeaderTime, isEvenWeek } from "../../Utils/handleTime";
import { useState, useEffect } from "react";
import { handlePlanning } from "../../Handlers/Schedule/weekHeader/handleWeekHeader";

export function WeekHeader({weekParity}) {
  const dispatch = useDispatch();

  const { active } = useSelector(s => s.active);
  const { date } = useSelector(s => s.date);
  const { groupNumber } = useSelector(s => s.groupNI);
  const { groupSchedule } = useSelector(s => s.groupSchedule);

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
    <>
    <div className="schedule-info-container">
      <div className='schedule__info schedule-info'>
        <div className='schedule-info__group schedule-info__item'>Группа: {groupNumber}</div>
        {active === 'schedule' && <div className='schedule-info__date schedule-info__item'>Дата: {clock[0]}. Время: {clock[1]}</div>}
        <div className='schedule-info__week-parity schedule-info__item'>
          {weekParity ? 
            `Неделя:  ${weekParity}`
            :
            `Неделя:  ${isEvenWeek(date)}`
          }
        </div>
      </div>
      {active === 'planning' &&
      <div className="planning-all-mark planning-all-mark__container">
        <div onClick={() => {handlePlanning(dispatch, false)}} 
             className="planning-all-mark__button planning-all-mark__button_red">
          Не посещать все пары
        </div>
        <div onClick={() => {handlePlanning(dispatch, true)}} 
             className="planning-all-mark__button planning-all-mark__button_green">
          Посещать все пары
        </div>
      </div>
      }
    </div>
    </>
  )
}
