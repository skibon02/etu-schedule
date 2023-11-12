 function routingFx(navigate, loc, vkData) {
  if (loc === '/' && vkData && vkData.is_authorized) {
    navigate('/schedule')
  }
  if (vkData  && !vkData.is_authorized) {
    navigate('/profile')
  }
}

export {
  routingFx,
}
