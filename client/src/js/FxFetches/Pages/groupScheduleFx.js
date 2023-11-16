import { groupScheduleFetch } from "../../ReduxStates/Slices/groupScheduleSlice";

async function groupScheduleFx(dispatch, groupId) {
  if (groupId) {
    dispatch(groupScheduleFetch(groupId));
  }
}

export {
  groupScheduleFx,
}