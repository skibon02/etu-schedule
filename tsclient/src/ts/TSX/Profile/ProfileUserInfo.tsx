import PROFILE from '../../../icons/profile.svg'
import BELL from '../../../icons/bell.svg'
import VkButton from './VkButton';
import DeAuthButton from './DeauthButton';
import { userDataStore } from '../../stores/userDataStore';
import { attendanceTokenStore } from '../../stores/attendanceTokenStore';
import { observer } from 'mobx-react';

function ProfileUserInfo() {
  
  const isAuthorized = userDataStore.vkData!.is_authorized;

  return (
    <div className="profile__user-info user-info">
      {/* {isAuthorized &&
      <div className={attendanceToken ? "profile__notifications profile-notifications" : "profile-notifications profile-notifications_true"}>
        <div className="profile-notifications__body">
          <div className="profile-notifications__notification attendance-token-notification">
            1
          </div>
          <img className='profile-notifications__image' src={BELL} draggable={false} />
        </div>
      </div>
      } */}
      <div className="user-info__avatar">
        <div className="user-info__image-container">
          {isAuthorized ?
            <img src={userDataStore.vkData!.profile_photo_url} alt="" className="user-info__image" draggable={false} />
            :
            <img onContextMenu={(e) => e.preventDefault()} src={PROFILE} alt="" className="user-info__image shitty-image" draggable={false} />
          }
        </div>
      </div>
      <div className="user-info__text-info">
        <div className="user-info__name">
          {isAuthorized ?
            userDataStore.vkData!.first_name + ' ' +
            userDataStore.vkData!.last_name
            :
            ''
          }
        </div>
        <div className="user-info__auth">
          <div className="user-info__auth-text">
            {isAuthorized ? 'Авторизован' : 'Не авторизован'}
          </div>
        </div>
        {!isAuthorized ? <VkButton /> : <DeAuthButton />}
      </div>
    </div>
  )
}

export default observer(ProfileUserInfo);
