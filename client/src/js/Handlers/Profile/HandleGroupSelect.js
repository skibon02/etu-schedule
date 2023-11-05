function handleGroupSelect(option, setGroupSchedule) {
  setGroupSchedule(null);
  window.localStorage.setItem('groupNumber', option.label);
  window.localStorage.setItem('groupId', option.value);
}

function handlefullNameEnabledSelect(option) {
  window.localStorage.setItem('fullNameEnabledValue', option.value);
  window.localStorage.setItem('fullNameEnabledLabel', option.label);
}

export {
  handleGroupSelect,
  handlefullNameEnabledSelect,
}