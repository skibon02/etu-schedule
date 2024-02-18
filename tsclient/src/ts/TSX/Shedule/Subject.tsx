import { useSubject } from "../../hooks/Schedule/useSubject";
import Attendance from "./Attendance";
import PlanningSwitch from "../Planning/PlanningSwitch";
import { activeStore } from "../../stores/activeStore";
import { makeClockTime } from "../../utils/Schedule/utils";
import { ISubjectProps } from "../../types/tsx/Schedule/SubjectTypes";
import { observer } from "mobx-react";

function Subject({subjectData, orderNumber, planning_time_link_id_value, schedule_diffs_value}: ISubjectProps) {
  const { 
    lessonStart, lessonEnd, 
    lessonName, lessonType, 
    teachers, roomName,
    time_link_id, isDead 
  } = useSubject(subjectData, orderNumber);

  return (
    <div className={activeStore.active === 'schedule' && isDead ? 
      "day__lesson lesson disabled-font" : 
      "day__lesson lesson"}>
      <div className="lesson__info">
        <div className="lesson__time">
          <div className={
            activeStore.active === 'schedule' && isDead ? 
            "lesson__start disabled-font" :
            "lesson__start"}>
            {makeClockTime(lessonStart)}
          </div>
          <div className={
            activeStore.active === 'schedule' && isDead ? 
            "lesson__end disabled-font" :
            "lesson__end"}>
            {makeClockTime(lessonEnd)}
          </div>
        </div>
        <div className="lesson__about">
          <div className="lesson__name">
            {lessonName}
          </div>
          <div className="lesson__teachers">
            {teachers}
          </div>
        </div>
        <div className="lesson__type-room lesson-type-room">
          <p className={activeStore.active === 'schedule' &&  isDead ? 
            "lesson-type-room__type disabled-font disabled-bg" :
            "lesson-type-room__type" }>
              {lessonType}
          </p>
          {roomName}
        </div>
      </div>
      {activeStore.active === 'schedule' &&
      <Attendance 
        key={planning_time_link_id_value ? 1 : 0}
        isDead={isDead}
        time_link_id={time_link_id}
        schedule_diffs_value={schedule_diffs_value}
        planning_time_link_id_value={planning_time_link_id_value} />
      }
      {activeStore.active === 'planning' && 
      <PlanningSwitch 
        time_link_id={time_link_id} 
        planning_time_link_id_value={planning_time_link_id_value} />
      }
    </div>
  )
}

export default observer(Subject);
