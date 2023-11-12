import { setGroupNI } from "../../ReduxStates/Slices/groupNISlice";
import { groupScheduleFetch } from "../../ReduxStates/Slices/groupScheduleSlice";

function groupScheduleIdFx(dispatch, groupId) {
  if (localStorage.getItem("groupId") !== null) {
    dispatch(setGroupNI({
      groupNumber: localStorage.getItem("groupNumber"),
      groupId: localStorage.getItem("groupId")
    }))
  }
  if (groupId) {
    dispatch(groupScheduleFetch(groupId));
  }
}

export {
  groupScheduleIdFx,
}