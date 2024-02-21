import { useEffect, useState } from 'react';
import { IUsableSchedule } from '../../types/stores/GroupTypes';
import { checkTimeAndSetTheme, knowSubjectTime, makeRooms, makeTeachers } from '../../utils/Schedule/utils';
import { userDataStore } from '../../stores/userDataStore';
import { groupStore } from '../../stores/groupStore';
import { dateStore } from '../../stores/dateStore';

export function useSubject(subjectData: IUsableSchedule, orderNumber: number) {

  const [lessonStart, lessonEnd, checkInDeadline] = knowSubjectTime(orderNumber, new Date(subjectData.date));
  const lessonName = subjectData.title;
  const lessonType = subjectData.subjectType;
  const teachers = makeTeachers(subjectData.teachers);
  const time_link_id = subjectData.time_link_id;

  const [isDead, setIsDead] = useState(checkTimeAndSetTheme(checkInDeadline));
  
  const userWeekNotes = groupStore.userNotes?.weeks[dateStore.weekNumber];
  const note = userWeekNotes === undefined || userWeekNotes.user_notes === undefined 
    ? '' 
    : userWeekNotes.user_notes[time_link_id] === undefined 
      ? '' 
      : userWeekNotes.user_notes[time_link_id];

  const groupWeekNotes = groupStore.groupNotes?.weeks[dateStore.weekNumber];
  const groupNote = groupWeekNotes === undefined || groupWeekNotes.group_notes === undefined
    ? ''
    : groupWeekNotes.group_notes[time_link_id] === undefined
      ? ''
      : groupWeekNotes.group_notes[time_link_id];

  const [userText, setUserText] = useState<string>(note);
  const [groupText, setGroupText] = useState<string>(groupNote);
  const [activeModal, setActiveModal] = useState<'none' | 'user' | 'group'>('none');
  
  useEffect(() => {
    if (subjectData.id !== userDataStore.activeSubjectId) {
      setActiveModal('none');
    }
  }, [userDataStore.activeSubjectId]);

  const roomName = makeRooms(subjectData.number, isDead);

  useEffect(() => {
    setIsDead(checkTimeAndSetTheme(checkInDeadline));

    const intervalId = setInterval(() => {
      setIsDead(checkTimeAndSetTheme(checkInDeadline));
    }, 1000 * 60 * 1);

    return () => clearInterval(intervalId);
  }, [checkInDeadline]);

  const handleUserNoteClick = () => {
    userDataStore.setActiveSubjectId(subjectData.id); 
    setActiveModal('user')
  }

  const handleUserNoteTitleClick = (e: any) => {
    if (activeModal === 'user') {
      setActiveModal('none'); 
      e.stopPropagation()
    }
  }

  const handleGroupNoteClick = () => {
    userDataStore.setActiveSubjectId(subjectData.id); 
    setActiveModal('group')
  }

  const handleGroupNoteTitleClick = (e: any) => {
    if (activeModal === 'group') {
      setActiveModal('none'); 
      e.stopPropagation()
    }
  }

  return { lessonStart, lessonEnd, lessonName, lessonType, teachers, time_link_id, roomName, isDead, 
    activeModal, setActiveModal, userText, setUserText, groupText, setGroupText, 
    handleUserNoteClick, handleUserNoteTitleClick, handleGroupNoteClick, handleGroupNoteTitleClick };
}
