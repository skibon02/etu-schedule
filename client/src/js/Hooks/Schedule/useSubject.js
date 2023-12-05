import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react';
import { makeTeachers } from '../../Utils/Schedule/Subject/makeTeachers';
import { knowSubjectTime } from '../../Utils/handleTime';
import { checkTimeAndSetTheme } from '../../Utils/Schedule/Subject/checkTimeAndSetTheme';
import { makeRooms } from '../../Utils/Schedule/Subject/makeRooms';

export function useSubject(subjectData, orderNumber) {
  const {active} = useSelector(s => s.active);

  const [lessonStart, lessonEnd, checkInDeadline] = knowSubjectTime(orderNumber, new Date(subjectData.date));
  const lessonName = subjectData.title;
  const lessonType = subjectData.subjectType;
  const teachers = makeTeachers(subjectData.teachers);
  const time_link_id = subjectData.time_link_id;

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme(checkInDeadline));
  
  const roomName = makeRooms(subjectData.number, isDead, active);

  useEffect(() => {
    setIsDead(checkTimeAndSetTheme(checkInDeadline));

    const intervalId = setInterval(() => {
      setIsDead(checkTimeAndSetTheme(checkInDeadline));
    }, 1000 * 60 * 1);

    return () => clearInterval(intervalId);
  }, [checkInDeadline]);

  return { lessonStart, lessonEnd, lessonName, lessonType, teachers, time_link_id, roomName, isDead, active }
}
