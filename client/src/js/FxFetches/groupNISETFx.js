import { groupNISETFetch } from "../ReduxStates/Slices/groupNISlice";
import { userDataGETFetch } from "../ReduxStates/Slices/userDataSlice";

export async function groupNISETFx(dispatch, groupId) {
  let groupSetFetch = await groupNISETFetch(groupId);
  if (groupSetFetch.ok) {
    dispatch(userDataGETFetch(dispatch));
  }
}