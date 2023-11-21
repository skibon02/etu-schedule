import { WeekHeader } from "./WeekHeader";
import { useSelector } from "react-redux";
import NoSchedule from "./NoSchedule";import makeSchedule from "../../Utils/Schedule/parseSchedule";
import Week from "./Week";

export default function Schedule() {

  const {date, weekNumber} = useSelector(s => s.date);
  const {active} = useSelector(s => s.active);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { groupSchedule, groupScheduleStatus, groupScheduleError } = useSelector(s => s.groupSchedule);

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

  const weekSchedule = makeSchedule(groupSchedule, new Date(date));
  
  if (weekSchedule) {
    return (
      <>
      <WeekHeader weekParity={null} />
      <Week
        weekSchedule={weekSchedule} />
      </>
    )
  }
}
