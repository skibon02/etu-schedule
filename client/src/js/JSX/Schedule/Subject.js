import { makeTeachers } from "../../Unpack/Schedule/Subject/makeTeachers";
import { checkTimeAndSetTheme } from "../../Utils/Schedule/Subject/checkTimeAndSetTheme";
import * as handlers from "../../Handlers/Schedule/Subject/handlers";
import { makeClockTime, knowSubjectTime } from "../../Utils/handleTime";
import { useState, useEffect } from "react";
import GPSLIGHT from '../../../icons/gpslite.svg'
import GPS from '../../../icons/location-pin-svgrepo-com.svg'
import Attendance from "./Attendance";
import PlanningSwitch from "../Planning/PlanningSwitch";

export function Subject({subjectData, orderNumber, active}) {
  const [toggleClock, setToggleClock] = useState(false);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId,  setTimerId] = useState(0);

  const [lessonStart, lessonEnd, checkInDeadline] = knowSubjectTime(orderNumber, new Date(subjectData.date));
  const lessonName = subjectData.title;
  const lessonType = subjectData.subjectType;
  // const roomName = subjectData.displayName;
  const roomName = subjectData.number;
  // const roomNumber = subjectData.number;
  const teachers = makeTeachers(subjectData.teachers);

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme(checkInDeadline));

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
          {roomName && 
          <p className='lesson-type-room__room'>
            <img 
              draggable={false} 
              className='lesson-type-room__image' 
              src={active === 'schedule' && isDead ? GPSLIGHT : GPS} 
              alt="gps" /> {roomName}
          </p>}
        </div>
      </div>
      {active === 'schedule' ?
        <Attendance 
        isDead={isDead}
        timerId={timerId}
        setTimerId={setTimerId}
        toggleClock={toggleClock}
        setToggleClock={setToggleClock}
        toggleMessage={toggleMessage}
        setToggleMessage={setToggleMessage}
        />
      :
      <PlanningSwitch />
      }
    </div>
  )
}