import { getGroupList } from "./Fetches";
 
function routingFx(loc, vkData, setGroupList, setGroupListError, navigate, setGroupId, setGroupNumber, groupNumber) {
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
  
  getGroupList(setGroupList, setGroupListError);
}

export {
  routingFx,
}
