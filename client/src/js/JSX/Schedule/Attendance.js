import { useSelector } from 'react-redux'
import { useState } from 'react';

import CLOCK from '../../../icons/icons8-clock.svg'
import * as handlers from '../../Handlers/Schedule/Subject/handlers'
import { addToQueue } from '../../FxFetches/Schedule/processScheduleQueue';
import { scheduleDiffsSETFetch } from '../../ReduxStates/Slices/scheduleDiffsSlice';

export default function Attendance({
  isDead, 
  time_link_id,
  schedule_diffs_value,
  planning_time_link_id_value
}) {
  const {date, weekNumber} = useSelector(s => s.date);

  const [toggleClock, setToggleClock] = useState(false);
  const [init, setInit] = useState(schedule_diffs_value !== null ? schedule_diffs_value : planning_time_link_id_value);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId, setTimerId] = useState(0);
  const [needToShow, setNeedToSHow] = useState(schedule_diffs_value === null);
  
  let clockClassNameNormal;
  let clockClassNamePulsing;

  if (schedule_diffs_value === null) {
    clockClassNameNormal = planning_time_link_id_value ? 'attendance__body attendance__body_green' : 'attendance__body attendance__body_red'
    clockClassNamePulsing = planning_time_link_id_value ? 'attendance__body attendance__body_red pulse-clock-red' : 'attendance__body attendance__body_green pulse-clock-green'
  } else if (schedule_diffs_value === false) {
    clockClassNameNormal = 'attendance__body attendance__body_red pulse-clock-red'
    clockClassNamePulsing = 'attendance__body attendance__body_green'
  } else if (schedule_diffs_value === true) {
    clockClassNameNormal = 'attendance__body attendance__body_green pulse-clock-green'
    clockClassNamePulsing = 'attendance__body attendance__body_red'
  }

  return (
    <>
    <div className={"lesson__attendance attendance"}>
      <div className="attendance__container" >
        <div 
          className='attendance__pseudo-body' 
          onClick={() => {
            handlers.handleClockClick(
              isDead,
              timerId,
              setToggleClock,
              setToggleMessage,
              toggleClock,
              setTimerId,
              setInit,
              needToShow,
              setNeedToSHow
            );
            // addToQueue([time_link_id, weekNumber, !init])}} >
            scheduleDiffsSETFetch(time_link_id, weekNumber, !init)}} >
          <div 
            className={
              isDead ? 
              "attendance__body attendance__body_green disabled-bg" : 
              !toggleClock ? 
              clockClassNameNormal :
              clockClassNamePulsing 
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
        {!needToShow && toggleMessage &&
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
    </>
  )
}