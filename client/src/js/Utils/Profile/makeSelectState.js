function makeFullNameEnabledDV() {
  const storedFullNameEnabledValue = {
    value: window.localStorage.getItem('fullNameEnabledValue'),
    label: window.localStorage.getItem('fullNameEnabledLabel')
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
    value: window.localStorage.getItem('groupId'),
    label: window.localStorage.getItem('groupNumber')
  };
  const defaultGroupNumberValue = storedGroupNumberValue.label ? 
  storedGroupNumberValue : {
    value: null, 
    label: 'Не выбрана'
  };
  return defaultGroupNumberValue;
}


export {
  makeFullNameEnabledDV,
  makeFullGroupNumberDV,
}
