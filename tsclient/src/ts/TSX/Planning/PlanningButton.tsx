import { PlanningButtonProps } from "../../types/tsx/Planning/PlanningButtonTypes";

export default function PlanningButton({parity, selectedParity, text, handleClick}: PlanningButtonProps) {
  return (
    <div 
      className={parity === selectedParity ? 
        "nav__item header-active nav__item_planning" :
        "nav__item header-hover nav__item_planning"}
        role="button" onClick={handleClick} >
      <span className='nav__text'>{text}</span>
    </div>
  )
}