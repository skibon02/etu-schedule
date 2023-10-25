function onInputChange(setInputValue, value) {
  setInputValue(value);
}

function onGroupClick(setGroupId, setGroupNumber, setActive, id, number) {
  setGroupId(id);
  setGroupNumber(number);
  setActive('schedule');
}

export {
  onInputChange,
  onGroupClick,
}