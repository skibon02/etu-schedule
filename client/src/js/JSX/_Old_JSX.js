import { useState, useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import CLOCK from './../../icons/icons8-clock.svg'
import GPS from './../../icons/location-pin-svgrepo-com.svg'
import GPSLIGHT from './../../icons/gpslite.svg'
import makeSchedule from '../functions/parseSchedule';
import knowTime from '../functions/handleTime';
import { makeUsableSchedule} from '../functions/parseSchedule';
import { makeClockTime, makeCalendarTime, isEvenWeek  } from '../functions/handleTime';
import Header from './Header';
import Groups from './Groups';
import VKButton from './VKButton';

import myfetch from '../functions/myfetch';
const DAYS = ["Воскресенье", 'Понедельник', 'Вторник', 'Среда', "Четверг", "Пятница", "Суббота"]

export function Pages() {
  const [date, setDate] = useState(new Date());
  const [active, setActive] = useState('groups');

  const [groupList, setGroupList] = useState(null);
  const [groupListError, setGroupListError] = useState(null);
  
  const [group, setGroup] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [groupSchedule, setGroupSchedule] = useState(null);

  useEffect(() => {
    async function getGroups() {
      try {
        let response = await myfetch('/api/groups');
        if (!response.ok) {
          throw new Error(`Failed to myfetch: ${response.status} ${response.statusText}`);
        }
        let data = await response.json();
  
        let groups = [];
        for (let k of Object.keys(data)) {
          groups.push({
            ...data[k],
            id: k
          });
        }
  
        setGroupList(groups);
      } catch (error) {
        setGroupListError(error.message);
      }
    }
  
    getGroups();
  }, []); // groupList

  useEffect(() => {
    if (group) {
      async function getGroupSchedule() {
        console.log(`/api/scheduleObjs/group/${group}`);
        setGroupSchedule(null);
        let response = await myfetch(`/api/scheduleObjs/group/${group}`);
        let data = await response.json();
        console.log('successful fetch on Schedule');
        console.log(data);
    
        setGroupSchedule(data);
        // window.localStorage.setItem('userPref', data);
        // alert(window.localStorage.getItem('userPref'))
      }

      getGroupSchedule();
    }

  }, [group]) // groupSchedule

 
  return (
    <>
    {groupListError && <div>Server troubles: {groupListError}</div>}
    {!groupListError && <div className='container'>
      {groupSchedule && <div className='under-header-box'></div>}
      {(!groupSchedule && !group || active === 'groups') && 
      <Groups 
        setGroup={setGroup}
        setActive={setActive}
        groupList={groupList}
        setGroupNumber={setGroupNumber}
       />}
      {groupSchedule && group &&
        <>
        <Header 
          date={date} 
          setDate={setDate} 
          active={active} 
          setActive={setActive}
          setGroupSchedule={setGroupSchedule}
          setGroup={setGroup}
          weekNumber={makeSchedule(groupSchedule, date)[1]}
        />
        {active === 'schedule' && 
          <>
          <div className='schedule-info-container'>
            <WeekHeader
              groupNumber={groupNumber}
              date={date} />
          </div>
          <Week 
            key={group} 
            weekSchedule={makeSchedule(groupSchedule, date)[0]}
            weekNumber={makeSchedule(groupSchedule, date)[1]} />
          </>
        }
        {active === 'planning' && <div>123</div>}
        {active === 'vk' && <VKButton />}
        {groupSchedule && <div className='under-header-box-mobile'></div>}
        </>
      }
      
    </div>}
    </>
  );
}

function WeekHeader({groupNumber, date}) {
  const [clock, setClock] = useState(formatTime(new Date()));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClock(formatTime(new Date()));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  function formatTime(date) {
    const calendarDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return [`${calendarDate}`, `${hours}:${minutes}:${seconds}`];
  }

  return (
    <div className='schedule__info schedule-info'>
      <div className='schedule-info__group schedule-info__item'>Группа: {groupNumber}</div>
      <div className='schedule-info__date schedule-info__item'>Дата: {clock[0]}. Время: {clock[1]}</div>
      <div className='schedule-info__week-parity schedule-info__item'>Неделя: {isEvenWeek(date)[0]}</div>
    </div>
  )

}

function Week({weekSchedule, weekNumber}) {
  const [week, setWeek] = useState([]);
  useEffect(() => {
    let initinalWeek = []
    for (let i = 0; i < weekSchedule.length; i++) {
      if (weekSchedule[i][0] !== null) {
        initinalWeek.push(<Day key={i} daySchedule={weekSchedule[i]}  />)
      } else {
        initinalWeek.push(
          <div key={i} className="day">
            <div className="day__date">
              {makeCalendarTime(weekSchedule[i][1], DAYS)}
            </div>
            <div className="day__lessons">
              <div className='day__empty'>
                <div className="day__empty-text">
                  so empty...
                </div>
              </div>
            </div>
          </div>
        )
      }
    }
    setWeek(initinalWeek);
  }, [weekSchedule]);
  console.log('Week Number is:');
  console.log(weekNumber);

  return (
    <div className="schedule">
      {/* <div>week number is {weekNumber}</div> */}
      {week}
    </div>
    )
}

function Day({daySchedule}) {
  let dayOfWeek = makeCalendarTime(daySchedule[0].date, DAYS)

  
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    let usableSchedule = makeUsableSchedule(daySchedule[i]);

    for (let j = usableSchedule.date.startIndex; j <= usableSchedule.date.endIndex; j++) {
      lessons.push(
        <Subject 
          key={daySchedule[i].id + ' ' + j.toString()} 
          props={usableSchedule} 
          i={j} 
        />
      );
    }
  }

  return (
    <div className="day">
      <div className="day__date">
        {dayOfWeek}
      </div>
      <div className="day__lessons">
        {lessons}
      </div>
    </div>
  )
}

function Subject({props, i}) {
  const [toggleClock, setToggleClock] = useState(false);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId,  setTimerId] = useState(0);

  let [lessonStart, lessonEnd, checkInDeadline] = knowTime(i, new Date(props.date.date));
  lessonStart = makeClockTime(lessonStart);
  lessonEnd = makeClockTime(lessonEnd);
  const lessonName = props.lesson.title;
  const lessonType = props.lesson.subjectType;
  // const roomName = props.lesson.displayName;
  const roomName = props.lesson.number;
  // const roomNumber = props.lesson.number;

  let teachers = [];
  for (let i = 0; i < props.teachers.length; i++) {
    let teacher = props.teachers[i];
    teachers.push(
      <div key={teacher.id} className="lesson__teacher">
        {teacher.surname} {teacher.name} {teacher.midname}
      </div>
    );
  }

  const checkTimeAndSetTheme = () => {
    const currentTime = new Date();
    let isLate = false;
    if (currentTime > checkInDeadline) {   
      isLate = true;
    } 
    return isLate;
  };

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme());

  useEffect(() => {
    setIsDead(checkTimeAndSetTheme());

    const intervalId = setInterval(() => {
      setIsDead(checkTimeAndSetTheme());
    }, 1000 * 60 * 1); // last number - number of minutes

    return () => clearInterval(intervalId);
  }, [checkInDeadline]);

  function handleClockClick() {
    if (!isDead) {
      clearTimeout(timerId);
      setToggleClock(!toggleClock)
      setToggleMessage(!toggleClock)

      setTimerId(setTimeout(() => {
        setToggleMessage(false)
      }, 5000));
    }
  }

  function handleMessageClick() {
    if (!isDead) {
      setToggleMessage(false);
    }
  }


  return (
    <div className={isDead ? "day__lesson lesson disabled-font" : "day__lesson lesson"}>
      <div className="lesson__info">
        <div className="lesson__time">
          <div className={
            isDead ? "lesson__start disabled-font" :
            "lesson__start"
          }>{lessonStart}</div>
          <div className={
            isDead ? "lesson__end disabled-font" :
            "lesson__end"
          }>{lessonEnd}</div>
        </div>
        <div className="lesson__about">
          <div className="lesson__name">
            {lessonName}
          </div>
          <div className="lesson__teachers">
            {teachers}
          </div>
        </div>
        <div className="lesson__type-room lesson-type-room">
          <p className={ isDead ? "lesson-type-room__type disabled-font disabled-bg" :
            "lesson-type-room__type" }>{lessonType}</p>
          {roomName && <p className='lesson-type-room__room'>
            <img 
            draggable={false} 
            className='lesson-type-room__image' 
            src={isDead ? GPSLIGHT : GPS} 
            alt="gps" /> {roomName}</p>}
        </div>
      </div>
      <div className={"lesson__attendance attendance"}>
        <div className="attendance__container" >
          <div className='attendance__pseudo-body' onClick={handleClockClick} >
            <div 
              className={
                isDead ? "attendance__body attendance__body_red disabled-bg" : 
                toggleClock ? "attendance__body attendance__body_red pulse-clock-red" :
                "attendance__body attendance__body_green" 
              } >
              <div className="attendance__icon attendance-icon">
                <img
                  className="attendance-icon__image"
                  src={CLOCK}
                  alt="ico"
                  draggable="false"
                />
              </div>
            </div>
          </div>
          {toggleClock && toggleMessage &&
            <div 
              className="attendance__message message"
              onClick={handleMessageClick} >
              Изменение актуально только для этой недели
            </div> 
          }
  
        </div>
      </div>
    </div>
  )
}
