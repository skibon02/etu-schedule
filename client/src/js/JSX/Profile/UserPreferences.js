import Select from 'react-select'
import { handlefullNameEnabledSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { makeGroupListSelect } from "../../Utils/Profile/makeGroupListSelect"
import { handleGroupSelect } from "../../Handlers/Profile/HandleGroupSelect"
import { groupFilterOptions } from "../../Utils/Profile/makeSelectState"

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

function TokenPreference({}) {
  return (
    <>
    <div className="profile__user-preference user-preference">

    </div>
    </>
  )
}

export {
  FullNamePreference,
  GroupPreference,
}
