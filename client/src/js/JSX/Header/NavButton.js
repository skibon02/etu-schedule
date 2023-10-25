export function NavButton({active, activeName, imageSrc, text, handleClick}) {
  return (
    <div 
      className={active === activeName ? 
        "nav__item header-active" :
        "nav__item header-hover"}
        onClick={handleClick} >
      <div className='nav__icon-container'>
        <img className='nav__icon' src={imageSrc} />
      </div>
      <span className='nav__text'>{text}</span>
    </div>
  )
}