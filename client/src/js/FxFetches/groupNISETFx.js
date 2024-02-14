import { groupNISETFetch, setGroupNI } from "../ReduxStates/Slices/groupNISlice";
import { groupScheduleFetch } from "../ReduxStates/Slices/groupScheduleSlice";

export async function groupNISETFx(dispatch, groupId, groupNumber) {
  await groupNISETFetch(groupId);
  dispatch(setGroupNI({
    groupId: groupId,
    groupNumber: groupNumber,
  }));
}
