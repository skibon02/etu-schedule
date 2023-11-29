import { groupScheduleFetch } from "../../ReduxStates/Slices/groupScheduleSlice";
import { planningDataGETFetch } from "../../ReduxStates/Slices/planningDataSlice";
import { scheduleDiffsGETFetch } from "../../ReduxStates/Slices/scheduleDiffsSlice";

async function groupScheduleFx(dispatch, groupId, groupNILoading) {
  if (groupId && !groupNILoading) {
    dispatch(groupScheduleFetch(groupId));
    dispatch(planningDataGETFetch());
    dispatch(scheduleDiffsGETFetch());  
  }
}

export {
  groupScheduleFx,
}