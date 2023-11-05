function handleGroupSelect(option, setGroupSchedule) {
  setGroupSchedule(null);
  localStorage.setItem('groupNumber', option.label);
  localStorage.setItem('groupId', option.value);
}

function handlefullNameEnabledSelect(option) {
  localStorage.setItem('fullNameEnabledValue', option.value);
  localStorage.setItem('fullNameEnabledLabel', option.label);
}

export {
  handleGroupSelect,
  handlefullNameEnabledSelect,
}