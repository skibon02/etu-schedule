import { useSelector } from 'react-redux';
import PROFILE from '../../../icons/profile.svg'
import BELL from '../../../icons/bell.svg'
import VKButton_old_v from "./VKButton_old_v";
import DeAuthButton from "./DeAuthButton";

export default function ProfileUserInfo() {
  
  const { vkData } = useSelector(s => s.vkData);
  const { attendanceToken } = useSelector(s => s.attendanceToken);
  
  const isAuthorized = vkData.is_authorized;

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
            <img src={vkData.profile_photo_url} alt="" className="user-info__image" draggable={false} />
            :
            <img src={PROFILE} alt="" className="user-info__image shitty-image" draggable={false} />
          }
        </div>
      </div>
      <div className="user-info__text-info">
        <div className="user-info__name">
          {isAuthorized ?
            vkData.first_name + ' ' +
            vkData.last_name
            :
            ''
          }
        </div>
        <div className="user-info__auth">
          <div className="user-info__auth-text">
            {isAuthorized ? 'Авторизован' : 'Не авторизован'}
          </div>
        </div>
        {!isAuthorized ? <VKButton_old_v /> : <DeAuthButton />}
      </div>
    </div>
  )
}