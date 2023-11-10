
 
function routingFx(loc, vkData, navigate, setGroupId, setGroupNumber) {

  if (localStorage.getItem("groupId") !== null) {
    setGroupId(localStorage.getItem("groupId"));
    setGroupNumber(localStorage.getItem("groupNumber"));
  }
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
