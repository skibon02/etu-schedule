import { useState } from 'react';
import { GroupDateService } from '../../services/GroupDateService';

export function useAttendance(schedule_diffs_value: null | boolean, planning_time_link_id_value: boolean, time_link_id: number, isDead: boolean) {

  const [toggleClock, setToggleClock] = useState(false);
  const [init, setInit] = useState(schedule_diffs_value !== null ? schedule_diffs_value : planning_time_link_id_value);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId, setTimerId] = useState(setTimeout(() => {}, 0));
  const [needToShow, setNeedToShow] = useState(schedule_diffs_value === null);
  
  let clockClassNameNormal;
  let clockClassNamePulsing;

  if (schedule_diffs_value === null) {
    clockClassNameNormal = planning_time_link_id_value ? 'attendance__body attendance__body_green' : 'attendance__body attendance__body_red'
    clockClassNamePulsing = planning_time_link_id_value ? 'attendance__body attendance__body_red pulse-clock-red' : 'attendance__body attendance__body_green pulse-clock-green'
  } else if (schedule_diffs_value === false) {
    clockClassNameNormal = 'attendance__body attendance__body_red pulse-clock-red'
    clockClassNamePulsing = 'attendance__body attendance__body_green'
  } else if (schedule_diffs_value === true) {
    clockClassNameNormal = 'attendance__body attendance__body_green pulse-clock-green'
    clockClassNamePulsing = 'attendance__body attendance__body_red'
  }

  
  function handleClockClick() {
    if (!isDead) {
      clearTimeout(timerId);
      setToggleClock(p => !p)
      if (needToShow) {
        setToggleMessage(true)
        setTimerId(setTimeout(() => {
          setToggleMessage(false)
        }, 5000));
      }
      setNeedToShow(!needToShow);
      setInit(p => !p);
    }
    GroupDateService.scheduleDiffsSETFetch(time_link_id, !init)
  }

  function handleMessageClick() {
    if (!isDead) {
      setToggleMessage(false);
    }
  }

  return { 
    toggleClock, 
    toggleMessage,
    needToShow,
    clockClassNameNormal, clockClassNamePulsing,
    handleClockClick, handleMessageClick
   }
}
