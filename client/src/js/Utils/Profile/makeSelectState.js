function makeFullNameEnabledDV() {
  const storedFullNameEnabledValue = {
    value: localStorage.getItem('fullNameEnabledValue'),
    label: localStorage.getItem('fullNameEnabledLabel')
  };
  const defaultFullNameEnabledValue = storedFullNameEnabledValue.label ? 
  storedFullNameEnabledValue : {
    value: 'auto', 
    label: 'Авто'
  };
  return defaultFullNameEnabledValue
}

function makeFullGroupNumberDV() {
  const storedGroupNumberValue = {
    value: localStorage.getItem('groupId'),
    label: localStorage.getItem('groupNumber')
  };
  const defaultGroupNumberValue = storedGroupNumberValue.label ? 
  storedGroupNumberValue : {
    value: null, 
    label: 'Не выбрана'
  };
  return defaultGroupNumberValue;
}

function groupFilterOptions(o, v) {
  return o.label.toLowerCase().indexOf(v.toLowerCase()) === 0
}

export {
  makeFullNameEnabledDV,
  makeFullGroupNumberDV,
  groupFilterOptions,
}
