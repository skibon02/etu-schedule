import { groupScheduleFetch } from "../../ReduxStates/Slices/groupScheduleSlice";
import { groupNIGETFetch } from "../../ReduxStates/Slices/groupNISlice";

async function groupScheduleIdFx(dispatch, groupId) {
  if (groupId) {
    dispatch(groupScheduleFetch(groupId));
  }
}

export {
  groupScheduleIdFx,
}