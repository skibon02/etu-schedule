import { observer } from "mobx-react";
import { CSSTransition } from "react-transition-group";
import { activeStore } from "../../stores/activeStore";
import { dateStore } from "../../stores/dateStore";
import { groupStore } from "../../stores/groupStore";
import { makeSchedule } from "../../utils/Schedule/parseSchedule";
import WeekHeader from "./WeekHeader";
import NoSchedule from "./NoSchedule";
import Week from "./Week";

function Schedule() {

  if (groupStore.groupNumberIdStatus !== 'done' || groupStore.groupScheduleStatus !== 'done' || groupStore.schedulePlanningStatus !== 'done' && groupStore.schedulePlanning === null || groupStore.scheduleDiffsStatus !== 'done' && groupStore.scheduleDiffs === null) {
    return <NoSchedule description="loading" />
  } else if (groupStore.groupNumberIdStatus === 'done' && groupStore.groupId === null) {
    return <NoSchedule description="noGroupChosen" />
  } else if (groupStore.groupScheduleStatus === 'done' && groupStore.groupSchedule !== null && !groupStore.groupSchedule.is_ready) {
    return <NoSchedule description="serverError" />
  } else if (groupStore.groupScheduleStatus === 'done' && groupStore.groupSchedule === null || groupStore.schedulePlanningStatus === 'done' && groupStore.schedulePlanning === null || groupStore.scheduleDiffsStatus === 'done' && groupStore.scheduleDiffs === null) {
    return <NoSchedule description="unknownError" />
  }

  const weekSchedule = makeSchedule(groupStore.groupSchedule!, new Date(dateStore.date));

  return (
    <CSSTransition in={activeStore.active === 'schedule'} timeout={300} classNames={'modal-transition'} unmountOnExit>
    <div className="modal-transition">
      <WeekHeader weekParity={null} />
      <Week weekSchedule={weekSchedule} />
    </div>
    </CSSTransition>
  )
}

export default observer(Schedule);
