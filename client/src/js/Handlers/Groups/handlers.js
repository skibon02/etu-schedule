function onInputChange(setInputValue, value) {
  setInputValue(value);
}

function onGroupClick(setGroup, setGroupNumber, setActive, id, number) {
  setGroup(id);
  setGroupNumber(number);
  setActive('schedule');
}

export {
  onInputChange,
  onGroupClick,
}