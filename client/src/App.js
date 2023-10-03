import { useState } from 'react';
import schedule from './schedule';
import { getLessonTime, getSortedWeekSchedule, formatDate } from './handleTime';

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
  const [lessonStart, lessonEnd] = getLessonTime(props.start, props.end);
  const lessonName = props.lesson.title;
  const lessonType = props.lesson.subjectType;
  const room = props.room;

  let teachers = [];
  for (let i = 0; i < props.teachers.length; i++) {
    let teacher = props.teachers[i];
    teachers.push(
      <div key={teacher.id} className="lesson__teacher">
        {`${teacher.surname} ${teacher.name} ${teacher.midname}`}
        {i == 0 ? ' ,' : ''}&nbsp;
      </div>
    );
  }


  return (
    <div className="day__lesson lesson">
      <div className="lesson__info">
        <div className="lesson__time">
          <div className="lesson__start">{lessonStart}</div>
          <div className="lesson__end">{lessonEnd}</div>
        </div>
        <div className="lesson__about">
          <div className="lesson__name">{lessonName}</div>
          <div className="lesson__teachers-room">
            <div className="lesson__teachers">
              {teachers}
            </div>
            <div className="lesson__room">
              <div className="lesson__room">{room}</div>
            </div>
          </div>
        </div>
        <div className="lesson__type">
          <p>{lessonType}</p>
        </div>
      </div>
      {/* <div className="lesson__attendance attendance attendance_locked">
        <div className="attendance__body">
          <div className="attendance__icon">
            <img src="icons/icons8-clock.svg" alt="ico" />
          </div>
          <div className="attendance__status attendance__status_planning attendance__status_active">
            Запланировать на сегодня
          </div>
        </div>
      </div> */}
    </div>
  )
}
