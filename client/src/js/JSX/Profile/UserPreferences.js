import Select from 'react-select'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect"
import { handleGroupSelect, handlefullNameEnabledSelect } from "../../Handlers/Profile/handleSelect"
import { groupFilterOptions } from "../../Utils/Profile/makeSelectState"
import { handleConfirmToken } from '../../Handlers/Profile/handleAttendanceToken'
import CROSSMARK from '../../../icons/cross-mark.svg'
import BadAttendanceToken from './BadAttendanceToken'
import DeleteTokenModal from './DeleteTokenModal'
import { handleEnterUp } from '../../Handlers/Profile/handleEnterUp'

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

  const { groupList } = useSelector(s => s.groupList);
  const { groupNumber } = useSelector(s => s.groupNI);
  const { groupChanged } = useSelector(s => s.attendanceToken);

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Постоянная группа:
      </div>
      <div className={!groupChanged ? "user-preference__value" : "user-preference__value user-preference__value_disabled"}>
        <Select 
          key={groupNumber} // !!!
          options={makeGroupListSelect(groupList)}
          onChange={(option) => handleGroupSelect(dispatch, option)}
          defaultValue={groupNumber ? {label: groupNumber} : {label: 'Группа не выбрана'}}
          filterOption={groupFilterOptions} />
      </div>
    </div>
  )
}

function TokenPreference() {
  const dispatch = useDispatch();

  const { attendanceToken, groupChanged, badAttendanceToken } = useSelector(s => s.attendanceToken);
  const [inputV, setInputV] = useState(attendanceToken ? attendanceToken : '');
  const [showModal, setShowModal] = useState(false);

  return (
    <>
    {badAttendanceToken && <BadAttendanceToken setInputV={setInputV} />}
    {showModal && <DeleteTokenModal setShowModal={setShowModal} />}
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Токен посещаемости:
      </div>
      <div className="user-preference__value">
        <div className="user-preference__access-token-container">
          <input 
            className={!groupChanged ? "user-preference__input" : "user-preference__input user-preference__input_disabled"}
            type="text" 
            placeholder='Введите токен'
            disabled={groupChanged}
            value={inputV} 
            onChange={(e) => setInputV(e.target.value)}
            onKeyUp={(e) => handleEnterUp(dispatch, inputV, e)} />
          {!attendanceToken ?
          <div 
            className="user-preference__button user-preference__confirm-button"
            onClick={() => handleConfirmToken(dispatch, inputV)}>
            <img src={CROSSMARK} alt="" className="user-preference__image" draggable={false} />
          </div>
          :
          <div 
            className="user-preference__button user-preference__delete-button"
            onClick={() => setShowModal(true)}>
            <div className='user-preference__button-mark'>✖</div>
          </div>  
          }
        </div>  
      </div>
    </div>
    </>
  )
}

export default function UserPreferences() {
  const { attendanceToken } = useSelector(s => s.attendanceToken);

  return (
    <div className="profile__user-preferences">
      <TokenPreference key={attendanceToken === null ? 1 : 0}  />
      <GroupPreference />
      <FullNamePreference />
    </div>
  )
}
