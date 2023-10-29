export function PlanningButton({parity, selectedParity, text, handleClick}) {
  return (
    <div 
      className={parity === selectedParity ? 
        "nav__item header-active" :
        "nav__item header-hover"}
        onClick={handleClick} >
      <span className='nav__text'>{text}</span>
    </div>
  )
}