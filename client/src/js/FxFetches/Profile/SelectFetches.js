function fullNameEnabledDVFx(setFullNameEnabledDV) {
  if (localStorage.getItem('fullNameEnabledValue') !== null) {
    setFullNameEnabledDV({
      value: localStorage.getItem('fullNameEnabledValue'), 
      label: localStorage.getItem('fullNameEnabledLabel')
    })
  }
}

function fullGroupNumberDVFx(setFullGroupNumberDV) { 
  if (localStorage.getItem('groupNumber') !== null) {
    setFullGroupNumberDV({
      value: localStorage.getItem('groupId'), 
      label: localStorage.getItem('groupNumber')
    })
  }
}



export {
  fullGroupNumberDVFx,
  fullNameEnabledDVFx,
}
