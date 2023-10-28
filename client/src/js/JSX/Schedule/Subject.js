import { makeTeachers } from "../../Unpack/Schedule/Subject/makeTeachers";
import { checkTimeAndSetTheme } from "../../Utils/Schedule/Subject/checkTimeAndSetTheme";
import * as handlers from "../../Handlers/Schedule/Subject/handlers";
import { makeClockTime, knowSubjectTime } from "../../Utils/handleTime";
import { useState, useEffect } from "react";
import GPSLIGHT from '../../../icons/gpslite.svg'
import GPS from '../../../icons/location-pin-svgrepo-com.svg'
import CLOCK from '../../../icons/icons8-clock.svg'

export function Subject({subjectData, orderNumber}) {
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
    <div className={isDead ? 
      "day__lesson lesson disabled-font" : 
      "day__lesson lesson"}>
      <div className="lesson__info">
        <div className="lesson__time">
          <div className={
            isDead ? 
            "lesson__start disabled-font" :
            "lesson__start"}>
            {makeClockTime(lessonStart)}
          </div>
          <div className={
            isDead ? 
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
          <p className={ isDead ? 
            "lesson-type-room__type disabled-font disabled-bg" :
            "lesson-type-room__type" }>
              {lessonType}
          </p>
          {roomName && 
          <p className='lesson-type-room__room'>
            <img 
              draggable={false} 
              className='lesson-type-room__image' 
              src={isDead ? GPSLIGHT : GPS} 
              alt="gps" /> {roomName}
          </p>}
        </div>
      </div>
      <div className={"lesson__attendance attendance"}>
        <div className="attendance__container" >
          <div 
            className='attendance__pseudo-body' 
            onClick={() => handlers.handleClockClick(
              isDead,
              timerId,
              setToggleClock,
              setToggleMessage,
              toggleClock,
              setTimerId
            )} >
            <div 
              className={
                isDead ? 
                "attendance__body attendance__body_red disabled-bg" : 
                toggleClock ? 
                "attendance__body attendance__body_red pulse-clock-red" :
                "attendance__body attendance__body_green" 
              } >
              <div className="attendance__icon attendance-icon">
                <img
                  className="attendance-icon__image"
                  src={CLOCK}
                  alt="ico"
                  draggable="false"
                />
              </div>
            </div>
          </div>
          {toggleClock && toggleMessage &&
            <div 
              className="attendance__message message"
              onClick={() => handlers.handleMessageClick(
                isDead,
                setToggleMessage
              )} >
              Изменение актуально только для этой недели
            </div> 
          }
        </div>
      </div>
    </div>
  )
}