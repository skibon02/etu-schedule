import Select from 'react-select'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { handlefullNameEnabledSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect"
import { handleGroupSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { groupFilterOptions } from "../../Utils/Profile/makeSelectState"
import { accessTokenUpdate, accessTokenDelete } from '../../FxFetches/Profile/AccessToken'
import { accessTokenFetch, setAccessToken } from '../../ReduxStates/Slices/accessTokenSlice'

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


function GroupPreference({fullGroupNumberDV}) {
  const { groupList, groupListStatus, groupListError } = useSelector((s) => s.groupList);
  const dispatch = useDispatch();

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Постоянная группа:
      </div>
      <div className="user-preference__value">
        <Select 
          options={makeGroupListSelect(groupList)}
          onChange={(option) => handleGroupSelect(dispatch, option)}
          defaultValue={fullGroupNumberDV}
          filterOption={groupFilterOptions} />
      </div>
    </div>
  )
}

function TokenPreference() {
  const dispatch = useDispatch();

  const { accessToken, accessTokenStatus, accessTokenError } = useSelector(s => s.accessToken);
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
            onClick={() => dispatch(accessTokenFetch())}>
            <div className='user-preference__button-mark'>✔</div>
          </div>
          :
          <div 
            className="user-preference__button user-preference__delete-button"
            // ALERT are u sure?
            onClick={() => dispatch(setAccessToken(null))}>
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
