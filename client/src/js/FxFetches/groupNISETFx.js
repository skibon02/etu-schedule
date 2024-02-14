import { groupNISETFetch, setGroupNI } from "../ReduxStates/Slices/groupNISlice";
import { setGroupSchedule } from "../ReduxStates/Slices/groupScheduleSlice";

export async function groupNISETFx(dispatch, groupId, groupNumber) {
  await groupNISETFetch(groupId);
  dispatch(setGroupSchedule(null));
  dispatch(setGroupNI({
    groupId: groupId,
    groupNumber: groupNumber,
  }));
}
