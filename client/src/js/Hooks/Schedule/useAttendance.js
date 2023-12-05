import { useSelector } from 'react-redux'
import { useState } from 'react';

export function useAttendance(schedule_diffs_value, planning_time_link_id_value) {

  const { weekNumber } = useSelector(s => s.date);

  const [toggleClock, setToggleClock] = useState(false);
  const [init, setInit] = useState(schedule_diffs_value !== null ? schedule_diffs_value : planning_time_link_id_value);
  const [toggleMessage, setToggleMessage] = useState(false);
  const [timerId, setTimerId] = useState(0);
  const [needToShow, setNeedToSHow] = useState(schedule_diffs_value === null);
  
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

  return { 
    weekNumber, 
    toggleClock, setToggleClock, 
    init, setInit, 
    toggleMessage, setToggleMessage,
    timerId, setTimerId,
    needToShow, setNeedToSHow,
    clockClassNameNormal, clockClassNamePulsing
   }
}
