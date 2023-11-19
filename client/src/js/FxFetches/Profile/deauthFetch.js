import myfetch from "../myfetch";
import { setGroupList } from '../../ReduxStates/Slices/groupListSlice'
import { setVkData } from "../../ReduxStates/Slices/vkDataSlice";
import { setGroupNI } from "../../ReduxStates/Slices/groupNISlice";
import { setGroupSchedule } from "../../ReduxStates/Slices/groupScheduleSlice";
import { setUserData } from "../../ReduxStates/Slices/userDataSlice";

async function deauthFetch(dispatch) {
  await myfetch('/api/auth/deauth', {method: "POST"} )
  localStorage.clear();
  dispatch(setVkData({}));
  dispatch(setGroupList(null));
  dispatch(setGroupNI({
    groupId: null,
    groupNumber: null,
  }));
  dispatch(setGroupSchedule(null));
  dispatch(setUserData(null));
}

export {
  deauthFetch,
}