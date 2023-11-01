import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { Week } from "./Week";
import { WeekHeader } from "./WeekHeader";
import { getWeekNumber } from "../../Utils/handleTime";

export default function Schedule({groupSchedule, groupNumber, date, active}) {
  if (!groupSchedule) {
    return (
      <div className="no-schedule">
        {!groupNumber && <div className="no-schedule__text">Выбери группу во вкладке "Группы"</div>}
        {groupNumber && <div className="no-schedule__text">Загрузка...</div>}
      </div>
    )
  }

  const weekSchedule = active === 'schedule' ? makeSchedule(groupSchedule, date) : groupSchedule;
  const weekNumber = getWeekNumber(date);

  return (
    <>
    <div className='schedule-info-container'>
      <WeekHeader
        groupNumber={groupNumber}
        date={date}
        active={active} />
    </div>
    <Week
      weekSchedule={weekSchedule}
      weekNumber={weekNumber}
      active={active} />
    </>
  )
}
