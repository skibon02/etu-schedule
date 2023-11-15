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

function groupFilterOptions(o, v) {
  return o.label.toLowerCase().indexOf(v.toLowerCase()) === 0
}

export {
  makeFullNameEnabledDV,
  groupFilterOptions,
}
