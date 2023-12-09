export function NavButton({imageSrc, text}) {
  return (
    <>
      <div className='nav__icon-container'>
        <img onContextMenu={(e) => e.preventDefault()} className='nav__icon' src={imageSrc} draggable={false} />
      </div>
      <span className='nav__text'>{text}</span>
    </>
  )
}