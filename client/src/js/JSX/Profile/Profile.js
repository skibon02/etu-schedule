import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import VKButton_old_v from "./VKButton_old_v";
import PROFILE from '../../../icons/profile.svg'
import { makeFullNameEnabledDV, makeFullGroupNumberDV } from "../../Utils/Profile/makeSelectState";
import { fullGroupNumberDVFx, fullNameEnabledDVFx } from "../../FxFetches/Profile/SelectFetches";
import DeAuthButton from "./DeAuthButton";
import { FullNamePreference, GroupPreference, TokenPreference } from "./UserPreferences";
import { groupListFetch } from "../../ReduxStates/Slices/groupListSlice";

export default function Profile({
  setGroupSchedule, 
  setGroupNumber, 
  setGroupId, 
  setAccessToken,
  accessToken
}) {
  const dispatch = useDispatch();

  const {groupList, groupListStatus, groupListError } = useSelector(s => s.groupList);
  const {vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);

  const [fullNameEnabledDV, setFullNameEnabledDV] = useState(makeFullNameEnabledDV());
  const [fullGroupNumberDV, setFullGroupNumberDV] = useState(makeFullGroupNumberDV());
  
  const isAuthorized = vkData.is_authorized;

  useEffect(() => {
    if (!groupList) {
      dispatch(groupListFetch())
    };
  }, []);

  useEffect(() => {
    fullNameEnabledDVFx(setFullNameEnabledDV)
  }, [localStorage.getItem('fullNameEnabledValue')]);

  useEffect(() => {
    fullGroupNumberDVFx(setFullGroupNumberDV)
  }, [localStorage.getItem('groupNumber')]);

  return (
    <>
    <div className="profile schedule">
      <div className="profile__user-info user-info">
        <div className="user-info__avatar">
          <div className="user-info__image-container">
            {isAuthorized ?
              <img src={vkData.profile_photo_url} alt="" className="user-info__image" />
              :
              <img src={PROFILE} alt="" className="user-info__image shitty-image" />
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
          {!isAuthorized && <VKButton_old_v />}
          {isAuthorized && 
            <DeAuthButton 
              setGroupSchedule={setGroupSchedule}
              setGroupId={setGroupId}
              setGroupNumber={setGroupNumber} />
          }
        </div>
      </div>
      {isAuthorized &&
        <div className="profile__user-preferences">
          <TokenPreference 
            setAccessToken={setAccessToken} 
            accessToken={accessToken} />
          <GroupPreference 
            fullGroupNumberDV={fullGroupNumberDV}
            setGroupSchedule={setGroupSchedule} />
          <FullNamePreference 
            fullNameEnabledDV={fullNameEnabledDV} />
        </div>
      }
    </div>
    </>
  )
}