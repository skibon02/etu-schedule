import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { CSSTransition } from "react-transition-group";
import { dateStore } from "../../stores/dateStore";
import { groupStore } from "../../stores/groupStore";
import { activeStore } from "../../stores/activeStore";
import NoSchedule from "../Shedule/NoSchedule";
import WeekHeader from "../Shedule/WeekHeader";
import PlanningHeader from "./PlanningHeader";
import Week from "../Shedule/Week";

function Planning() {

  const [weekParity, setWeekParity] = useState(dateStore.absoluteWeekParity);
  const [inCSST, setInCSST] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setInCSST(true);
    }, 100);
  }, []);

  if (groupStore.groupNumberIdStatus !== 'done' || groupStore.groupScheduleStatus !== 'done' || groupStore.schedulePlanningStatus !== 'done' || groupStore.scheduleDiffsStatus !== 'done') {
    return <NoSchedule description="loading" />
  } else if (groupStore.groupNumberIdStatus === 'done' && groupStore.groupId === null) {
    return <NoSchedule description="noGroupChosen" />
  } else if (groupStore.groupScheduleStatus === 'done' && groupStore.groupSchedule !== null && !groupStore.groupSchedule.is_ready) {
    return <NoSchedule description="serverError" />
  } else if (groupStore.groupScheduleStatus === 'done' && groupStore.groupSchedule === null || groupStore.schedulePlanningStatus === 'done' && groupStore.schedulePlanning === null || groupStore.scheduleDiffsStatus === 'done' && groupStore.scheduleDiffs === null) {
    return <NoSchedule description="unknownError" />
  }

  return (
    <CSSTransition in={activeStore.active === 'planning'} timeout={300} classNames={'modal-transition'} unmountOnExit>
    <div className="modal-transition">
      <PlanningHeader weekParity={weekParity} setWeekParity={setWeekParity} setInCSST={setInCSST} />

      <CSSTransition in={inCSST} timeout={100} classNames={'week-transition'} unmountOnExit>
        <div className="week-transition">
          <WeekHeader weekParity={weekParity} />
          <Week weekSchedule={weekParity === '1' ? groupStore.parsedSchedule1! : groupStore.parsedSchedule2!} />
        </div>
      </CSSTransition>

      <div className="under-planning-thead-box-mobile"></div>
    </div>
    </CSSTransition>
  );
}

export default observer(Planning);
