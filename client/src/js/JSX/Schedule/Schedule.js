import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { Week } from "./Week";
import { WeekHeader } from "./WeekHeader";
import NoSchedule from "./NoSchedule";
import { useSelector } from "react-redux";

export default function Schedule() {

  const {date, weekNumber} = useSelector(s => s.date);
  const {active} = useSelector(s => s.active);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { groupSchedule, groupScheduleStatus, groupScheduleError } = useSelector(s => s.groupSchedule);

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

  const weekSchedule = active === 'schedule' ? makeSchedule(groupSchedule, new Date(date)) : groupSchedule;

  return (
    <>
    <div className='schedule-info-container'>
      <WeekHeader weekParity={null} />
    </div>
    <Week
      weekSchedule={weekSchedule} />
    </>
  )
}
