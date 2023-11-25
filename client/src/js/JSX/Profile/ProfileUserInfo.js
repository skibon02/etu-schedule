import { useSelector } from 'react-redux';
import PROFILE from '../../../icons/profile.svg'
import VKButton_old_v from "./VKButton_old_v";
import DeAuthButton from "./DeAuthButton";

export default function ProfileUserInfo() {
  const {vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);
  
  const isAuthorized = vkData.is_authorized;

  return (   
    <div className="profile__user-info user-info">
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