import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';
import { activeStore } from '../../stores/activeStore';
import { dateStore } from '../../stores/dateStore';
import { groupStore } from '../../stores/groupStore';
import CALENDAR from './../../../icons/calendar-pen.svg';
import NAVCLOCK from './../../../icons/clock-for-nav.svg';
import NavButton from './NavButton';
import ScheduleButton from './ScheduleButton';
import ProfileButton from './ProfileButton';

function Header() {
  return (
    <div className="header">
      <div className="header__nav nav">
        <NavLink to='/schedule' className={activeStore.active === 'schedule' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={NAVCLOCK}
            text={'Расписание'}
          />
        </NavLink>
        <NavLink to='/planning' className={activeStore.active === 'planning' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <NavButton
            imageSrc={CALENDAR}
            text={'Планирование'}
          />
        </NavLink>
        <NavLink to='/profile' className={activeStore.active === 'profile' ? 
        "nav__item header-active" :
        "nav__item header-hover"}>
          <ProfileButton />
        </NavLink>
      </div>
      {activeStore.active === 'schedule' && groupStore.groupSchedule && groupStore.groupSchedule.is_ready &&
      <div className="header__week-buttons">
        <ScheduleButton 
          text={'К предыдущей неделе'} 
          handleClick={dateStore.decDate} 
        />
        <ScheduleButton 
          text={'К текущей неделе'} 
          handleClick={dateStore.curDate} 
        />
        <ScheduleButton 
          text={'К следующей неделе'} 
          handleClick={dateStore.incDate} 
        />
      </div>}
    </div>
  )
}

export default observer(Header);
