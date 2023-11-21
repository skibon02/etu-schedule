import { useState, useEffect } from "react";
import { WeekHeader } from "../Schedule/WeekHeader";
import { isEvenWeek } from "../../Utils/handleTime";
import { useDispatch, useSelector } from "react-redux";
import NoSchedule from "../Schedule/NoSchedule";
import PlanningHeader from "./PlanningHeader";
import Week from "../Schedule/Week";

export default function Planning() {

  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { groupSchedule, parsedSchedule1, parsedSchedule2 } = useSelector(s => s.groupSchedule);
  const {planningData, planningDataStatus, planningDataError} = useSelector(s => s.planningData);

  const [weekParity, setWeekParity] = useState(isEvenWeek(new Date));

  if (!groupSchedule) {
    return (
      <NoSchedule groupNumber={groupNumber} />
    );
  }
  
  if (!groupSchedule.is_ready) {
    return (
      <NoSchedule groupNumber={-1} />
    );
  }

  if (planningData) {
    return (
      <>  
      <PlanningHeader weekParity={weekParity} setWeekParity={setWeekParity} />
  
      {weekParity === '1' ?
      <>
      <WeekHeader weekParity={weekParity} />
      <Week weekSchedule={parsedSchedule1} />
      </>
      :
      <>
      <WeekHeader weekParity={weekParity} />
      <Week weekSchedule={parsedSchedule2} />
      </>
      }

      <div className="under-planning-thead-box-mobile"></div>
      </>
    );
  } else {
    return <div>123</div>
  }
}