import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { Week } from "./Week";
import { WeekHeader } from "./WeekHeader";

export default function Schedule({groupSchedule, groupNumber, date}) {
  return (
    <>
    <div className='schedule-info-container'>
      <WeekHeader
        groupNumber={groupNumber}
        date={date} />
    </div>
    <Week
      weekSchedule={makeSchedule(groupSchedule, date)[0]}
      weekNumber={makeSchedule(groupSchedule, date)[1]} />
    </>
  )
}
