import { useState, useRef, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import CLOCK from './../../icons/icons8-clock.svg'
import GPS from './../../icons/location-pin-svgrepo-com.svg'
import GPSLIGHT from './../../icons/gpslite.svg'
import makeSchedule from '../functions/handleTime';
import scheduleObjects2 from '../functions/schedule';
import knowTime from '../functions/knowTime';
import { makeUsableSchedule, makeClockTime, makeCalendarTime } from '../functions/handleTime';
import Header from './Header';

const DAYS = ["Воскресенье", 'Понедельник', 'Вторник', 'Среда', "Четверг", "Пятница", "Суббота"]

export default function Schedule() {
  const [date, setDate] = useState(new Date());
  const [active, setActive] = useState('schedule');

  console.log(makeSchedule(scheduleObjects2, date))
  
  return (
    <div className="container">
      <Header 
        date={date} 
        setDate={setDate} 
        active={active} 
        setActive={setActive}
      />
      {active === 'schedule' && <Week weekSchedule={makeSchedule(scheduleObjects2, date)} />}
      {active === 'planning' && <div>123</div>}
    </div>
  )
}



function Week({weekSchedule}) {
  let week = [];
  for (let i = 0; i < weekSchedule.length; i++) {
    if (weekSchedule[i][0] !== null) {
      week.push(<Day key={i} daySchedule={weekSchedule[i]}/>)
    } else {
      week.push(
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

  return (
    <div className="schedule">
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
          date={usableSchedule.date.date} 
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


function Subject({props, i, date}) {
  const [toggleClock, setToggleClock] = useState(false);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId,  setTimerId] = useState(0);
  const [isDead, setIsDead] = useState(true);

  let [lessonStart, lessonEnd, checkInDeadline] = knowTime(i, new Date(date));
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
    if (
      currentTime.getFullYear() > checkInDeadline.getFullYear() ||

      currentTime.getFullYear() === checkInDeadline.getFullYear() &&
      currentTime.getMonth() > checkInDeadline.getMonth() ||

      (currentTime.getFullYear() === checkInDeadline.getFullYear() &&
      currentTime.getMonth() === checkInDeadline.getMonth() &&
      currentTime.getDate() > checkInDeadline.getDate()) ||

      (currentTime.getFullYear() === checkInDeadline.getFullYear() &&
      currentTime.getMonth() === checkInDeadline.getMonth() &&
      currentTime.getDate() === checkInDeadline.getDate() &&
      currentTime.getHours() > checkInDeadline.getHours()) ||

      (currentTime.getFullYear() === checkInDeadline.getFullYear() &&
      currentTime.getMonth() === checkInDeadline.getMonth() &&
      currentTime.getDate() === checkInDeadline.getDate() &&
      currentTime.getHours() === checkInDeadline.getHours() &&
      currentTime.getMinutes > checkInDeadline.getMinutes)
    ) {
      isLate = true;
    } 
    if (isLate) setIsDead(true)
    else setIsDead(false);
  };

  useEffect(() => {
    checkTimeAndSetTheme();

    const intervalId = setInterval(() => {
      checkTimeAndSetTheme();
    }, 1000 * 60 * 1); // last number - number of minutes

    return () => clearInterval(intervalId);
  }, []);

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
