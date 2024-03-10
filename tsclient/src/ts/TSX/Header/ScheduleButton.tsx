import { ScheduleButtonProps } from "../../types/tsx/Header/ScheduleButtonTypes";

function ScheduleButton({handleClick, text}: ScheduleButtonProps) {
  return (
    <div className='header__week-button header-hover' role="button" onClick={handleClick}>
        <div className="header__week-button-text">{text}</div>
    </div> 
  )
}

export default ScheduleButton;