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

export {
  fullNameEnabledDVFx,
}
