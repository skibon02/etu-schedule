import CLOCK from '../../../icons/icons8-clock.svg'
import * as handlers from '../../Handlers/Schedule/Subject/handlers'

export default function Attendance({
  isDead, 
  timerId, 
  setTimerId, 
  toggleClock, 
  setToggleClock, 
  toggleMessage, 
  setToggleMessage}) {
  return (
    <>
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
    </>
  )
}