import { useSelector } from "react-redux"
import PROFILE from '../../../icons/profile.svg'


export default function ProfileButton() {
  const { attendanceToken } = useSelector(s => s.attendanceToken);

  return (
    <>
      <div className={attendanceToken ? 'nav__icon-container' : 'nav__icon-container nav__icon-container_notification'}>
        {!attendanceToken && 
        <div className="attendance-token-notification">
          1
        </div>
        }
        <img onContextMenu={(e) => e.preventDefault()} className='nav__icon' src={PROFILE} draggable={false} />
      </div>
      <span className='nav__text'>Профиль</span>
    </>
  )
}