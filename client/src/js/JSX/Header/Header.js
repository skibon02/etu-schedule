import { useDispatch, useSelector } from 'react-redux'
import { setActive } from '../../ReduxStates/Slices/activeSlice'
import CALENDAR from './../../../icons/calendar-pen.svg'
import NAVCLOCK from './../../../icons/clock-for-nav.svg'
import SEARCH from '../../../icons/search_2-for-nav.svg'
// import VK from '../../../icons/vk-for-nav.svg'
import VK from '../../../icons/profile.svg'
import { NavLink } from 'react-router-dom'

import { NavButton } from './NavButton'
import { ScheduleButton } from './ScheduleButton'

import { handleCurrentWeek, handleNextWeek, handlePrevWeek } from '../../Handlers/Header/handlers'

export default function Header() {
  const dispatch = useDispatch();

  const {active} = useSelector(s => s.active);
  const {date, weekNumber} = useSelector(s => s.date);
  const { groupSchedule } = useSelector(s => s.groupSchedule);

  return (
    <div className="header">
      <div className="header__nav nav">
        <NavLink to='/schedule' className={active === 'schedule' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={NAVCLOCK}
            text={'Расписание'}
            onClick={() => dispatch(setActive('schedule'))}
          />
        </NavLink>
        <NavLink to='/planning' className={active === 'planning' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={CALENDAR}
            text={'Планирование'}
            onClick={() => dispatch(setActive('planning'))}
          />
        </NavLink>
        <NavLink to='/profile' className={active === 'profile' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={VK}
            text={'Профиль'}
            onClick={() => dispatch(setActive('profile'))}
          />
        </NavLink>
      </div>
      {active === 'schedule' && groupSchedule && groupSchedule.is_ready &&
      <div className="header__week-buttons">
        <ScheduleButton 
          text={'К предыдущей неделе'} 
          handleClick={() => handlePrevWeek(dispatch, new Date(date), weekNumber)} 
        />
        <ScheduleButton 
          text={'К текущей неделе'} 
          handleClick={() => handleCurrentWeek(dispatch)} 
        />
        <ScheduleButton 
          text={'К следующей неделе'} 
          handleClick={() => handleNextWeek(dispatch, new Date(date), weekNumber)} 
        />
      </div>}
    </div>
  );
}
