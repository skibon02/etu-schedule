import { useEffect, useState } from 'react';
import { IUsableSchedule } from '../../types/stores/GroupTypes';
import { checkTimeAndSetTheme, knowSubjectTime, makeRooms, makeTeachers } from '../../utils/Schedule/utils';

export function useSubject(subjectData: IUsableSchedule, orderNumber: number) {

  const [lessonStart, lessonEnd, checkInDeadline] = knowSubjectTime(orderNumber, new Date(subjectData.date));
  const lessonName = subjectData.title;
  const lessonType = subjectData.subjectType;
  const teachers = makeTeachers(subjectData.teachers);
  const time_link_id = subjectData.time_link_id;

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme(checkInDeadline));
  
  const roomName = makeRooms(subjectData.number, isDead);

  useEffect(() => {
    setIsDead(checkTimeAndSetTheme(checkInDeadline));

    const intervalId = setInterval(() => {
      setIsDead(checkTimeAndSetTheme(checkInDeadline));
    }, 1000 * 60 * 1);

    return () => clearInterval(intervalId);
  }, [checkInDeadline]);

  return { lessonStart, lessonEnd, lessonName, lessonType, teachers, time_link_id, roomName, isDead }
}
