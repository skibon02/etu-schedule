import { observer } from 'mobx-react';
import { attendanceTokenStore } from '../../stores/attendanceTokenStore';
import PROFILE from '../../../icons/profile.svg';

function ProfileButton() {

  return (
    <>
      <div className={attendanceTokenStore.attendanceToken ? 'nav__icon-container' : 'nav__icon-container nav__icon-container_notification'}>
        {!attendanceTokenStore.attendanceToken && 
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

export default observer(ProfileButton);
