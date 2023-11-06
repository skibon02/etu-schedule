import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { Week } from "./Week";
import { WeekHeader } from "./WeekHeader";
import { getWeekNumber } from "../../Utils/handleTime";
import NoSchedule from "./NoSchedule";

export default function Schedule({groupSchedule, groupNumber, date, active}) {
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
