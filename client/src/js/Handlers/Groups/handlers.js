import { getGroupSchedule } from "../../FxFetches/Pages/Fetches";

function onInputChange(setInputValue, value) {
  setInputValue(value);
}

function onGroupClick(setGroupId, setGroupNumber, setActive, id, number, setGroupSchedule) {
  setGroupId(id);
  setGroupNumber(number);
  setGroupSchedule(null);
  setActive('schedule');
  getGroupSchedule(id, setGroupSchedule);
  console.log('group id:');
  console.log(id);
}

export {
  onInputChange,
  onGroupClick,
}