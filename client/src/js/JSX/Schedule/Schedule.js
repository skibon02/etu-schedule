import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { Week } from "./Week";
import { WeekHeader } from "./WeekHeader";
import { getWeekNumber } from "../../Utils/handleTime";
import NoSchedule from "./NoSchedule";
import { useSelector } from "react-redux";

export default function Schedule({groupSchedule, groupNumber, date}) {
  const {active} = useSelector(s => s.active)

  if (!groupSchedule && active === 'schedule' ) {
    return (
      <NoSchedule groupNumber={groupNumber} />
    )
  }
  
  if (!groupSchedule.is_ready && active === 'schedule' ) {
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
        date={date} />
    </div>
    <Week
      weekSchedule={weekSchedule}
      weekNumber={weekNumber} />
    </>
  )
}
