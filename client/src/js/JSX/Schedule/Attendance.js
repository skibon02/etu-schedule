import { useAttendance } from '../../Hooks/Schedule/useAttendance';
// import { handleClockClick, handleMessageClick } from '../../Handlers/Schedule/Subject/handlers'
// import { addToQueue } from '../../FxFetches/Schedule/processScheduleQueue';

export default function Attendance({
  isDead, 
  time_link_id,
  schedule_diffs_value,
  planning_time_link_id_value
}) {

  const { 
    toggleClock, toggleMessage, needToShow,
    clockClassNameNormal, clockClassNamePulsing,
    handleClockClick, handleMessageClick
  } = useAttendance(schedule_diffs_value, planning_time_link_id_value, time_link_id, isDead);

  return (
    <>
    <div className={"lesson__attendance attendance"}>
      <div className="attendance__container" >
        <div  
          className='attendance__pseudo-body' 
          onClick={handleClockClick} >
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
            onClick={handleMessageClick} >
            Изменение актуально только для этой недели
          </div> 
        }
      </div>
    </div>
    </>
  )
}
