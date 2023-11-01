import { useState, useEffect } from "react";
import VKButton_old_v from "./VKButton_old_v";
import PROFILE from '../../../icons/profile.svg'

export default function Profile({vkData, setVkData}) {
  const isAuthorized = vkData.is_authorized;

  return (
    <>
    <div className="profile-container">
      <div className="profile schedule">
        <div className="profile__image-container">
          {isAuthorized ?
            <img src={vkData.profile_photo_url} alt="pic" className="profile__true-image profile__image" />
            :
            <img src={PROFILE} alt="" className="profile__false-image profile__image" />
          }
        </div>
        {isAuthorized ?
          <div className="profile__user-name">
            <div className="profile__name-true profile__name">
              {vkData.first_name}
            </div>
            <div className="profile__name-true profile__name">
              {vkData.last_name}
            </div>
          </div>
          :
          <div className="profile__user-name">
            <div className="profile__name-false profile__name">
              Пользователь
            </div>
            <div className="profile__name-false profile__name">
              Неизвестен
            </div>
          </div>
        }
        {!isAuthorized && <div className="profile__access-denied">Мы не повзолим пользоваться сайтом без авторизации!</div>}
        <div className="profile__status status">
          {isAuthorized ? 
            <div className="status__true">
              Вы авторизованы
            </div>
            :
            <div className="status__false">
              Вы не авторизованы
            </div>
          }
        </div>
        {isAuthorized &&
          <div className="profile__choose-group-message">
            Теперь сайт может запомнить твой выбор при указании номера группы. Перейди во вкладку "Группы" и убедись! 
            {window.localStorage.getItem("groupNumber") !== null ? 
            <p>Сейчас номер постоянной группы: {window.localStorage.getItem("groupNumber")}.</p>
            :
            <p>Сейчас ты не выбрал постоянную группу.</p>
            }
          </div>
        }
        {isAuthorized && <div className="profile__reauth">Ты можешь авторизоваться ещё раз, мы не запрещаем</div>}
        <VKButton_old_v setVkData={setVkData} />
      </div>
    </div>
    </>
  )
}