export function ScheduleButton({handleClick, text}) {
  return (
    <div 
      className='header__week-button header-hover' onClick={handleClick}>
        {text}
    </div> 
  )
}