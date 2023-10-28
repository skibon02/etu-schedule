function onInputChange(setInputValue, value) {
  setInputValue(value);
}

function onGroupClick(setGroupId, setGroupNumber, setActive, id, number, setGroupSchedule) {
  setGroupId(id);
  setGroupNumber(number);
  setGroupSchedule(null);
  setActive('schedule');
}

export {
  onInputChange,
  onGroupClick,
}