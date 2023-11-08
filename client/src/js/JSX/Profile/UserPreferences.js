import Select from 'react-select'
import { useState } from 'react'
import { handlefullNameEnabledSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect"
import { handleGroupSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { groupFilterOptions } from "../../Utils/Profile/makeSelectState"
import { accessTokenUpdate, accessTokenDelete } from '../../FxFetches/Profile/AccessToken'

function FullNamePreference({fullNameEnabledDV}) {
  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Отображение названий предметов
      </div>
      <div className="user-preference__value">
        <Select 
          options={[
            {value: 'auto', label: 'Авто'},
            {value: 'short', label: 'Сокращённое'},
          ]}
          onChange={handlefullNameEnabledSelect}
          defaultValue={fullNameEnabledDV} />
      </div>
    </div>
  )
}


function GroupPreference({groupList, fullGroupNumberDV, setGroupSchedule}) {
  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Постоянная группа:
      </div>
      <div className="user-preference__value">
        <Select 
          options={makeGroupListSelect(groupList)}
          onChange={(option) => handleGroupSelect(option, setGroupSchedule)}
          defaultValue={fullGroupNumberDV}
          filterOption={groupFilterOptions} />
      </div>
    </div>
  )
}

function TokenPreference({setAccessToken, accessToken}) {
  const [inputV, setInputV] = useState('');
  const [inputClass, setInputClass] = useState(!accessToken ? 
    'user-preference__input_enabled' : 
    'user-preference__input_disabled');
  return (
    <>
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Аксесс токен:
      </div>
      <div className="user-preference__value">
        <div className="user-preference__access-token-container">
          <input 
            type="text" 
            placeholder='Введите токен'
            value={inputV} 
            className="user-preference__input"
            onChange={(e) => setInputV(e.target.value)} />
          {!accessToken ?
          <div 
            className="user-preference__button user-preference__confirm-button"
            onClick={() => accessTokenUpdate(inputV, setAccessToken, setInputClass)}>
            <div className='user-preference__button-mark'>✔</div>
          </div>
          :
          <div 
            className="user-preference__button user-preference__delete-button"
            onClick={() => accessTokenDelete(setAccessToken, setInputClass)}>
            <div className='user-preference__button-mark'>✖</div>
          </div>  
          }
        </div>  
      </div>
    </div>
    </>
  )
}

export {
  FullNamePreference,
  GroupPreference,
  TokenPreference,
}
