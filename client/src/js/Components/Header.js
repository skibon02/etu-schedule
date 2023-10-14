import CALENDAR from './../../icons/calendar-pen.svg'
import NAVCLOCK from './../../icons/clock-for-nav.svg'
import SEARCH from '../../icons/search-for-nav.svg'

export default function Header({date, setDate, active, setActive}) {
  // const [clock, setClock] = useState(formatTime(new Date()));

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     setClock(formatTime(new Date()));
  //   }, 1000);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []);
  
  // function formatTime(date) {
  //   const calendarDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  //   const hours = date.getHours().toString().padStart(2, '0');
  //   const minutes = date.getMinutes().toString().padStart(2, '0');
  //   const seconds = date.getSeconds().toString().padStart(2, '0');
  //   return `${calendarDate} ${hours}:${minutes}:${seconds}`;
  // }

  function handleNextWeek() {
    setDate(new Date(date.getTime() + 24 * 60 * 60 * 1000 * 7));
  }

  function handlePrevWeek() {
    setDate(new Date(date.getTime() - 24 * 60 * 60 * 1000 * 7));
  }

  function handleScheduleClick() {
    setActive('schedule');
  }

  function handlePlanningClick() {
    setActive('planning');
  }

  function handleGroupsClick() {
    setActive('groups');
  }

  return (
    <div className="header">
      <div className="header__nav nav">
        <div 
          className="nav__item header-hover"
          onClick={handleScheduleClick} >
          <div className='nav__icon-container'>
            <img className='nav__icon nav__shitty-clock' src={NAVCLOCK} alt="calendar" />
          </div>
          <span className='nav__text'>Расписание</span>
        </div>
        <div 
          className="nav__item header-hover"
          onClick={handlePlanningClick} >
          <div className='nav__icon-container'>
            <img className='nav__icon' src={CALENDAR} alt="calendar" />
          </div>
          <span className='nav__text'>Планирование</span>
        </div>
        <div 
          className="nav__item header-hover"
          onClick={handleGroupsClick} >
          <div className='nav__icon-container'>
            <img className='nav__icon' src={SEARCH} alt="calendar" />
          </div>
          <span className='nav__text'>Группы</span>
        </div>
      </div>
      {active === 'schedule' && <div className="header__week-buttons">
        <div 
          className='header__week-button header-hover' onClick={handlePrevWeek}>
          Предыдущая неделя
        </div> 
        <div 
          className='header__week-button header-hover' onClick={handleNextWeek}>
            Следующая неделя
        </div> 
        {/* <div className="header__time header-time">
          <span className='header-time__text'>Дата и время:</span>
          <br />
          {clock}
        </div> */}
      </div>}
    </div>
  )
}