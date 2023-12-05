import { useAttendance } from '../../Hooks/Schedule/useAttendance';
import * as handlers from '../../Handlers/Schedule/Subject/handlers'
import { addToQueue } from '../../FxFetches/Schedule/processScheduleQueue';
import { scheduleDiffsSETFetch } from '../../ReduxStates/Slices/scheduleDiffsSlice';

export default function Attendance({
  isDead, 
  time_link_id,
  schedule_diffs_value,
  planning_time_link_id_value
}) {

  const { 
    weekNumber, 
    toggleClock, setToggleClock, 
    init, setInit, 
    toggleMessage, setToggleMessage,
    timerId, setTimerId,
    needToShow, setNeedToSHow,
    clockClassNameNormal, clockClassNamePulsing
   } = useAttendance(schedule_diffs_value, planning_time_link_id_value);

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
              <div className="attendance-icon__image"></div>
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
