import { useState, useEffect } from "react";
import VKButton_old_v from "./VKButton_old_v";
import Select from 'react-select'
import PROFILE from '../../../icons/profile.svg'
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect";
import { handleGroupSelect, handlefullNameEnabledSelect } from "../../Handlers/Profile/HandleGroupSelect";
import { makeFullNameEnabledDV, makeFullGroupNumberDV } from "../../Utils/Profile/makeSelectState";
import { fullGroupNumberDVFx, fullNameEnabledDVFx } from "../../FxFetches/Profile/SelectFetches";

export default function Profile({vkData, setVkData, groupList}) {
  const [fullNameEnabledDV, setFullNameEnabledDV] = useState(makeFullNameEnabledDV());
  const [fullGroupNumberDV, setFullGroupNumberDV] = useState(makeFullGroupNumberDV());
  
  const isAuthorized = vkData.is_authorized;

  useEffect(() => {
    fullNameEnabledDVFx(setFullNameEnabledDV)
  }, [window.localStorage.getItem('fullNameEnabledValue')]);

  useEffect(() => {
    fullGroupNumberDVFx(setFullGroupNumberDV)
  }, [window.localStorage.getItem('groupNumber')]);

  return (
    <>
    <div class="profile schedule">
      <div class="profile__user-info user-info">
        <div class="user-info__avatar">
          <div class="user-info__image-container">
            {isAuthorized ?
              <img src={vkData.profile_photo_url} alt="" class="user-info__image" />
              :
              <img src={PROFILE} alt="" class="user-info__image" />
            }
          </div>
        </div>
        <div class="user-info__text-info">
          <div class="user-info__name">
            {isAuthorized ?
              vkData.first_name + ' ' +
              vkData.last_name
              :
              ''
            }
          </div>
          <div class="user-info__auth">
            <div class="user-info__auth-text">
              {isAuthorized ? 'Авторизован' : 'Не авторизован'}
            </div>
          </div>
        </div>
        {!isAuthorized && <VKButton_old_v setVkData={setVkData} />}
      </div>
      {isAuthorized &&
        <div class="profile__user-preferenses">
         <div class="profile__user-preference user-preference">
            <div class="user-preference__title">
              Постоянная группа:
            </div>
            <div class="user-preference__value">
                <Select 
                  options={makeGroupListSelect(groupList)}
                  onChange={handleGroupSelect}
                  defaultValue={fullGroupNumberDV} />
            </div>
          </div>
         <div class="profile__user-preference user-preference">
            <div class="user-preference__title">
              Отображение названий предметов
            </div>
            <div class="user-preference__value">
                <Select 
                  options={[
                    {value: 'auto', label: 'Авто'},
                    {value: 'short', label: 'Сокращённое'},
                  ]}
                  onChange={handlefullNameEnabledSelect}
                  defaultValue={fullNameEnabledDV} />
            </div>
          </div>
        </div>
      }
    </div>
    </>
  )
}