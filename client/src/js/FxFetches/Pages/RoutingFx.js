import { setGroupNI } from "../../ReduxStates/Slices/groupNISlice";
 
function routingFx(navigate, dispatch, loc, vkData) {

  if (localStorage.getItem("groupId") !== null) {
    dispatch(setGroupNI({
      groupNumber: localStorage.getItem("groupNumber"),
      groupId: localStorage.getItem("groupId")
    }))
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
