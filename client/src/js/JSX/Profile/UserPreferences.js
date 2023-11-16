import Select from 'react-select'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect"
import { handleGroupSelect, handlefullNameEnabledSelect } from "../../Handlers/Profile/handleSelect"
import { groupFilterOptions } from "../../Utils/Profile/makeSelectState"
import { accessTokenFetch, setAccessToken } from '../../ReduxStates/Slices/accessTokenSlice'
import CROSSMARK from '../../../icons/cross-mark.svg'

function FullNamePreference() {
  const dispatch = useDispatch();

  const {fullNameEnabledValue, fullNameEnabledLabel} = useSelector(s => s.fullNameEnabled);

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Отображение названий предметов
      </div>
      <div className="user-preference__value">
        <Select 
          key={fullNameEnabledValue} // !!!
          options={[
            {value: 'auto', label: 'Авто'},
            {value: 'shorten', label: 'Сокращённое'},
          ]}
          onChange={(option) => handlefullNameEnabledSelect(dispatch, option)}
          defaultValue={{label: fullNameEnabledLabel}} />
      </div>
    </div>
  )
}

function GroupPreference() {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log(`don't forget about react-cringe with groupNumberDV in <GroupPreference />...`);
  }, []);

  const { groupList, groupListStatus, groupListError } = useSelector(s => s.groupList);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Постоянная группа:
      </div>
      <div className="user-preference__value">
        <Select 
          key={groupNumber} // !!!
          options={makeGroupListSelect(groupList)}
          onChange={(option) => handleGroupSelect(dispatch, option)}
          defaultValue={{label: groupNumber}}
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
            <img src={CROSSMARK} alt="" className="user-preference__image" draggable={false} />
          </div>
          :
          <div 
            className="user-preference__button user-preference__delete-button"
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
