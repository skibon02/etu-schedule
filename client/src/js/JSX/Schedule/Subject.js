import { useState, useEffect } from "react";
import { makeRooms } from "../../Utils/Schedule/Subject/makeRooms";
import { makeTeachers } from "../../Utils/Schedule/Subject/makeTeachers";
import { checkTimeAndSetTheme } from "../../Utils/Schedule/Subject/checkTimeAndSetTheme";
import { makeClockTime, knowSubjectTime } from "../../Utils/handleTime";
import Attendance from "./Attendance";
import PlanningSwitch from "../Planning/PlanningSwitch";
import { useSelector } from "react-redux";

export function Subject({subjectData, orderNumber, planning_time_link_id_value, schedule_diffs_value}) {
  const {active} = useSelector(s => s.active);

  const [lessonStart, lessonEnd, checkInDeadline] = knowSubjectTime(orderNumber, new Date(subjectData.date));
  const lessonName = subjectData.title;
  const lessonType = subjectData.subjectType;
  const teachers = makeTeachers(subjectData.teachers);
  const time_link_id = subjectData.time_link_id;

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme(checkInDeadline));
  
  const roomName = makeRooms(subjectData.number, isDead, active);

  useEffect(() => {
    setIsDead(checkTimeAndSetTheme(checkInDeadline));

    const intervalId = setInterval(() => {
      setIsDead(checkTimeAndSetTheme(checkInDeadline));
    }, 1000 * 60 * 1);

    return () => clearInterval(intervalId);
  }, [checkInDeadline]);

  return (
    <div className={active === 'schedule' && isDead ? 
      "day__lesson lesson disabled-font" : 
      "day__lesson lesson"}>
      <div className="lesson__info">
        <div className="lesson__time">
          <div className={
            active === 'schedule' && isDead ? 
            "lesson__start disabled-font" :
            "lesson__start"}>
            {makeClockTime(lessonStart)}
          </div>
          <div className={
            active === 'schedule' && isDead ? 
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
          <p className={active === 'schedule' &&  isDead ? 
            "lesson-type-room__type disabled-font disabled-bg" :
            "lesson-type-room__type" }>
              {lessonType}
          </p>
          {roomName}
        </div>
      </div>
      {active === 'schedule' &&
        <Attendance 
          key={planning_time_link_id_value ? 1 : 0}
          isDead={isDead}
          time_link_id={time_link_id}
          schedule_diffs_value={schedule_diffs_value}
          planning_time_link_id_value={planning_time_link_id_value} />
      }
      {active === 'planning' && 
      <PlanningSwitch 
        key={planning_time_link_id_value ? 1 : 0}
        time_link_id={time_link_id} 
        planning_time_link_id_value={planning_time_link_id_value} />
      }
    </div>
  )
}
