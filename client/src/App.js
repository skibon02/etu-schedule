import { useState, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import schedule from './schedule';
import { getLessonTime, getSortedWeekSchedule, formatDate } from './handleTime';
import CLOCK from './icons/icons8-clock.svg'
import GPS from './icons/location-pin-svgrepo-com.svg'

export default function App() {
  const sortedWeekSchedule = getSortedWeekSchedule(schedule);
  console.log(sortedWeekSchedule);
  

  return (
    <div className="container">
      <Week weekSchedule={sortedWeekSchedule} />
    </div>
  )
  
}

function Week({weekSchedule}) {
  let week = [];
  for (let i = 0; i < weekSchedule.length; i++) {
    if (weekSchedule[i].length !== 0) week.push(<Day key={i} daySchedule={weekSchedule[i]}/>);
  }

  return (
    <div className="schedule">
      {week}
    </div>
    )
}

function Day({daySchedule}) {
  const date = formatDate(daySchedule[0].start);
  
  let lessons = [];
  for (let i = 0; i < daySchedule.length; i++) {
    lessons.push(<Subject key={daySchedule[i].id} props={daySchedule[i]} />);
  }
  return (
    <div className="day">
      <div className="day__date">
        {date}
      </div>
      <div className="day__lessons">
        {lessons}
      </div>
    </div>
  )
}


function Subject({props}) {
  const [toggleClock, setToggleClock] = useState(false);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId,  setTimerId] = useState(0);

  const [lessonStart, lessonEnd] = getLessonTime(props.start, props.end);
  const lessonName = props.lesson.title;
  const lessonType = props.lesson.subjectType;
  const room = props.room;

  let teachers = [];
  for (let i = 0; i < props.teachers.length; i++) {
    let teacher = props.teachers[i];
    teachers.push(
      <div key={teacher.id} className="lesson__teacher">
        {teacher.surname} {teacher.name} {teacher.midname}
      </div>
    );
  }

  function handleClockClick() {
    clearTimeout(timerId);
    setToggleClock(!toggleClock)
    setToggleMessage(!toggleClock)

    setTimerId(setTimeout(() => {
      setToggleMessage(false)
    }, 5000));
  }

  function handleMessageClick() {
    setToggleMessage(false);
  }


  return (
    <div className="day__lesson lesson">
      <div className="lesson__info">
        <div className="lesson__time">
          <div className="lesson__start">{lessonStart}</div>
          <div className="lesson__end">{lessonEnd}</div>
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
          <p className="lesson-type-room__type">{lessonType}</p>
          {room && <p className='lesson-type-room__room'><img draggable={false} className='lesson-type-room__image' src={GPS} alt="gps" /> {room}</p>}
        </div>
      </div>
      <div className="lesson__attendance attendance">
        <div className="attendance__container" >
          <div className='attendance__pseudo-body' onClick={handleClockClick} >
            <div 
              className={toggleClock ? "attendance__body attendance__body_red pulse-clock-red" :
              "attendance__body attendance__body_green" } >
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
