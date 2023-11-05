function fullNameEnabledDVFx(setFullNameEnabledDV) {
  if (localStorage.getItem('fullNameEnabledValue') !== null) {
    setFullNameEnabledDV({
      value: localStorage.getItem('fullNameEnabledValue'), 
      label: localStorage.getItem('fullNameEnabledLabel')
    })
  } else {
    setFullNameEnabledDV({
      value: 'auto', 
      label: 'Авто'
    });
  }
}

function fullGroupNumberDVFx(setFullGroupNumberDV) { 
  if (localStorage.getItem('groupNumber') !== null) {
    setFullGroupNumberDV({
      value: localStorage.getItem('groupId'), 
      label: localStorage.getItem('groupNumber')
    })
  } else {
    setFullGroupNumberDV({
      value: null, 
      label: 'Не выбрана'
    });
  }
}



export {
  fullGroupNumberDVFx,
  fullNameEnabledDVFx,
}
