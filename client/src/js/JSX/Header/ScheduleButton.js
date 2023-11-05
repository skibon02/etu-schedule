export function ScheduleButton({handleClick, text}) {
  return (
    <div 
      className='header__week-button header-hover' onClick={handleClick}>
        <div className="header__week-button-text">{text}</div>
    </div> 
  )
}