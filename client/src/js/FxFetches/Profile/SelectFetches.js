function fullNameEnabledDVFx(setFullNameEnabledDV) {
  if (window.localStorage.getItem('fullNameEnabledValue') !== null) {
    setFullNameEnabledDV({
      value: window.localStorage.getItem('fullNameEnabledValue'), 
      label: window.localStorage.getItem('fullNameEnabledLabel')
    })
  }
}

function fullGroupNumberDVFx(setFullGroupNumberDV) { 
  if (window.localStorage.getItem('groupNumber') !== null) {
    setFullGroupNumberDV({
      value: window.localStorage.getItem('groupId'), 
      label: window.localStorage.getItem('groupNumber')
    })
  }
}



export {
  fullGroupNumberDVFx,
  fullNameEnabledDVFx,
}
