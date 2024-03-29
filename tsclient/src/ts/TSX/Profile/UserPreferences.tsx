import { useState } from 'react'
import { observer } from 'mobx-react'
import Select, { SingleValue } from 'react-select'
import { userDataStore } from '../../stores/userDataStore'
import { attendanceTokenStore } from '../../stores/attendanceTokenStore'
import { groupStore } from '../../stores/groupStore'
import { groupFilterOptions, handleEnterUp, makeGroupListSelect } from '../../utils/Profile/utils'
import { fullNameOptionType, groupOptionType } from '../../types/tsx/Profile/UserPreferencesTypes'
import DeleteTokenModal from './DeleteTokenModal'
import InvalidTokenModal from './InvalidTokenModal'
import TokenDescriptionModal from './TokenDescriptionModal'
import TooManyRequestsModal from './TooManyRequestsModal'
import { GroupDateTokenService } from '../../services/GroupDateTokenService'
import LeaderForGroupModal from './LeaderForGroupModal'

function FullNamePreference() {

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Отображение названий предметов:
      </div>
      <div className="user-preference__value">
        <Select 
          key={userDataStore.fullNameEnabled.value} // !!!
          options={[
            {value: 'auto', label: 'Авто'},
            {value: 'shorten', label: 'Сокращённое'},
          ]}
          onChange={(option: SingleValue<fullNameOptionType>) => option!.value === 'auto' ? userDataStore.fullNameEnabledAuto() : userDataStore.fullNameEnabledShort()}
          defaultValue={{label: userDataStore.fullNameEnabled.label, value: userDataStore.fullNameEnabled.value}} />
      </div>
    </div>
  )
}

function GroupPreference() {

  return (
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Постоянная группа:
      </div>
      <div className={!attendanceTokenStore.attendanceToken ? "user-preference__value" : "user-preference__value user-preference__value_disabled"}>
        <Select 
          key={groupStore.groupId} // !!!
          noOptionsMessage={() => 'Похоже, что такой группы нет'}
          options={groupStore.groupList ? makeGroupListSelect(groupStore.groupList) : [{label: 'Загрузка...', value: 0}]}
          onChange={(option: SingleValue<groupOptionType>) => {if (typeof option!.value === 'number') GroupDateTokenService.groupIdSetFetch(option!.value, option!.label)}}
          defaultValue={groupStore.groupNumber ? {label: groupStore.groupNumber, value: groupStore.groupId} : groupStore.groupNumberIdStatus === 'pending' ? {label: 'Загрузка...', value: 'loading'} : {label: 'Группа не выбрана', value: null}}
          filterOption={groupFilterOptions} />
      </div>
    </div>
  )
}

function TokenPreference() {

  const [inputV, setInputV] = useState(attendanceTokenStore.attendanceToken ? attendanceTokenStore.attendanceToken : '');
  const [showDeleteTokenModal, setShowDeleteTokenModal] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  return (
    <>
    <InvalidTokenModal setInputV={setInputV} inCSST={!attendanceTokenStore.isTokenValid} />
    <DeleteTokenModal setShowModal={setShowDeleteTokenModal} inCSST={showDeleteTokenModal} />
    <TokenDescriptionModal setShowDescription={setShowDescription} showDescription={showDescription} />
    <TooManyRequestsModal inCSST={attendanceTokenStore.tooManyRequests} />
    <div className="profile__user-preference user-preference">
      <div className="user-preference__title">
        Токен посещаемости:
        <div className='attendance-token__description-container'>
          <div className="attendance-token__description" role="button" onClick={() => setShowDescription(true)}>
            Как получить токен?
          </div>
        </div>
      </div>
      <div className="user-preference__value">
        <div className="user-preference__attendance-token-container">
          <input 
            className={!attendanceTokenStore.attendanceToken && attendanceTokenStore.loadingStatus !== 'pending' ? "user-preference__input user-preference__input_notification" : "user-preference__input user-preference__input_disabled"}
            type="text" 
            placeholder='Введите токен'
            disabled={!!attendanceTokenStore.attendanceToken || !attendanceTokenStore.isTokenValid}
            value={attendanceTokenStore.loadingStatus === 'pending' ? 'Загрузка...' : inputV} 
            onChange={(e) => setInputV(e.target.value)}
            onKeyUp={(e) => handleEnterUp(inputV, e)} />
          {attendanceTokenStore.loadingStatus === 'pending' ?
          <div className="loader-token"></div>
          :
          !attendanceTokenStore.attendanceToken ?
          <div 
            className="user-preference__button user-preference__confirm-button"
            role="button" onClick={() => {GroupDateTokenService.attendanceTokenSetFetch(inputV)}}>
          </div>
          :
          <div 
            className="user-preference__button user-preference__delete-button"
            role="button" onClick={() => setShowDeleteTokenModal(true)}>
          </div>  
          }
        </div>
      </div>
    </div>
    </>
  )
}

function LeaderForGroupInfo() {
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <div className="profile__user-preference user-preference leader-for-group-preference">
      <div className="user-preference__title">
        Информация для старост
      </div>
      <div className="user-preference__value">
        <div role="button" onClick={() => setShowModal(true)} className='attendance-token__description leader-for-group-preference__button'>Как мне оставлять заметки для группы?</div>
        <LeaderForGroupModal setShowModal={setShowModal} inCSST={showModal} />
      </div>
    </div>
    )
}

const ObsFullNamePreference = observer(FullNamePreference);
const ObsGroupPreference = observer(GroupPreference);
const ObsTokenPreference = observer(TokenPreference);
const ObsLeaderForGroupInfo = observer(LeaderForGroupInfo);

function UserPreferences() {

  return (
    <div className="profile__user-preferences">
      <ObsTokenPreference key={attendanceTokenStore.attendanceToken === null ? 1 : 0}  />
      <ObsGroupPreference />
      <ObsFullNamePreference />
      <ObsLeaderForGroupInfo />
    </div>
  )
}

export default observer(UserPreferences);
