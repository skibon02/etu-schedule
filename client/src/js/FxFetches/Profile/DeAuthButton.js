import myfetch from "../myfetch";
import { setGroupList } from '../../ReduxStates/Slices/groupListSlice'
import { setVkData } from "../../ReduxStates/Slices/vkDataSlice";
import { setGroupNI } from "../../ReduxStates/Slices/groupNISlice";
import { setGroupSchedule } from "../../ReduxStates/Slices/groupScheduleSlice";

async function deauth(dispatch) {
  await myfetch('/api/auth/deauth', {method: "POST"} )
  localStorage.clear();
  dispatch(setVkData({}));
  dispatch(setGroupList(null));
  dispatch(setGroupNI({
    groupId: null,
    groupNumber: null,
  }));
  dispatch(setGroupSchedule(null));
}

export {
  deauth,
}