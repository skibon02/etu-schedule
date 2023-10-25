import CALENDAR from './../../../icons/calendar-pen.svg'
import NAVCLOCK from './../../../icons/clock-for-nav.svg'
import SEARCH from '../../../icons/search-for-nav.svg'
import VK from '../../../icons/vk-for-nav.svg'

import { NavButton } from './NavButton'
import { ScheduleButton } from './ScheduleButton'

import * as handlers from '../../Handlers/Header/handlers'

export default function Header({date, setDate, active, setActive, setGroupSchedule, setGroupId, weekNumber}) {

  return (
    <div className="header">
      <div className="header__nav nav">
        <NavButton
          active={active}
          activeName={'schedule'}
          imageSrc={NAVCLOCK}
          text={'Расписание'}
          handleClick={() => handlers.handleScheduleClick(setActive)}
        />
        <NavButton
          active={active}
          activeName={'planning'}
          imageSrc={CALENDAR}
          text={'Планирование'}
          handleClick={() => handlers.handlePlanningClick(setActive)}
        />
        <NavButton
          active={active}
          activeName={'groups'}
          imageSrc={SEARCH}
          text={'Группы'}
          handleClick={() => handlers.handleGroupsClick(setActive, setGroupId, setGroupSchedule)}
        />
        <NavButton
          active={active}
          activeName={'pofile'}
          imageSrc={VK}
          text={'Профиль'}
          handleClick={() => handlers.handleProfileClick(setActive)}
        />
      </div>
      {active === 'schedule' && 
      <div className="header__week-buttons">
        <ScheduleButton 
          text={'К предыдущей неделе'} 
          handleClick={() => handlers.handlePrevWeek(setDate, date, weekNumber)} 
        />
        <ScheduleButton 
          text={'К текущей неделе'} 
          handleClick={() => handlers.handleCurrentWeek(setDate)} 
        />
        <ScheduleButton 
          text={'К следующей неделе'} 
          handleClick={() => handlers.handleNextWeek(setDate, date, weekNumber)} 
        />
      </div>}
    </div>
  )
}
