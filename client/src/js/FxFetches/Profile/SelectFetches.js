function fullNameEnabledDVFx(setFullNameEnabledDV) {
  setFullNameEnabledDV({
    value: window.localStorage.getItem('fullNameEnabledValue'), 
    label: window.localStorage.getItem('fullNameEnabledLabel')
  })
}

function fullGroupNumberDVFx(setFullGroupNumberDV) {
  setFullGroupNumberDV({
    value: window.localStorage.getItem('groupId'), 
    label: window.localStorage.getItem('groupNumber')
  })
}



export {
  fullGroupNumberDVFx,
  fullNameEnabledDVFx,
}
