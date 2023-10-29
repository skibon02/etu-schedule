export function NavButton({active, activeName, imageSrc, text, handleClick}) {
  return (
    <>
      <div className='nav__icon-container'>
        <img className='nav__icon' src={imageSrc} />
      </div>
      <span className='nav__text'>{text}</span>
    </>
  )
}