import CALENDAR from './../../../icons/calendar-pen.svg'
import NAVCLOCK from './../../../icons/clock-for-nav.svg'
import SEARCH from '../../../icons/search_2-for-nav.svg'
// import VK from '../../../icons/vk-for-nav.svg'
import VK from '../../../icons/profile.svg'
import { NavLink } from 'react-router-dom'

import { NavButton } from './NavButton'
import { ScheduleButton } from './ScheduleButton'

import * as handlers from '../../Handlers/Header/handlers'

export default function Header({date, setDate, active, setActive, weekNumber}) {

  return (
    <div className="header">
      <div className="header__nav nav">
        <NavLink to='schedule' className={active === 'schedule' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={NAVCLOCK}
            text={'Расписание'}
            onClick={() => handlers.handleScheduleClick(setActive)}
          />
        </NavLink>
        <NavLink to='planning' className={active === 'planning' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={CALENDAR}
            text={'Планирование'}
            onClick={() => handlers.handlePlanningClick(setActive)}
          />
        </NavLink>
        <NavLink to='/' className={active === 'groups' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={SEARCH}
            text={'Группы'}
            onClick={() => handlers.handleGroupsClick(setActive)}
          />
        </NavLink>
        <NavLink to='profile' className={active === 'profile' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={VK}
            text={'Профиль'}
            onClick={() => handlers.handleProfileClick(setActive)}
          />
        </NavLink>
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
