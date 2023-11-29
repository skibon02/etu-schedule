import { WeekHeader } from "./WeekHeader";
import { useSelector } from "react-redux";
import makeSchedule from "../../Utils/Schedule/parseSchedule";
import NoSchedule from "./NoSchedule";
import Week from "./Week";

export default function Schedule() {

  const { date } = useSelector(s => s.date);
  const { groupNumber, groupNILoading } = useSelector(s => s.groupNI);
  const { groupSchedule } = useSelector(s => s.groupSchedule);

  if (!groupSchedule) {
    return (
      <NoSchedule groupNumber={groupNumber} groupNILoading={groupNILoading} />
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
