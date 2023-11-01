function onInputChange(setInputValue, value) {
  setInputValue(value);
}

function onGroupClick(setGroupId, setGroupNumber, setActive, id, number, setGroupSchedule, isChecked) {
  setGroupId(id);
  setGroupNumber(number);
  setGroupSchedule(null);
  setActive('schedule');
  if (isChecked) {
    window.localStorage.setItem("groupId", id)
    window.localStorage.setItem("groupNumber", number)
  }
}

export {
  onInputChange,
  onGroupClick,
}