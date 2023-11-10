import myfetch from "../myfetch";
import { setGroupList } from '../../ReduxStates/Slices/groupListSlice'
import { setVkData } from "../../ReduxStates/Slices/vkDataSlice";

async function deauth(dispatch, setGroupNumber, setGroupId, setGroupSchedule) {
  await myfetch('/api/auth/deauth', {method: "POST"} )
  localStorage.clear();
  setVkData({});
  setGroupId(null);
  dispatch(setGroupList(null));
  setGroupNumber(null);
  setGroupSchedule(null);
}

export {
  deauth,
}