import { setGroupSchedule } from "../../ReduxStates/Slices/groupScheduleSlice";
import { groupNISETFx } from "../../FxFetches/groupNISETFx";
import { userDataSETFetch } from "../../ReduxStates/Slices/userDataSlice";
import { setFullNameEnabled } from "../../ReduxStates/Slices/fullNameEnabledSlice";

function handleGroupSelect(dispatch, option) {
  dispatch(setGroupSchedule(null));
  groupNISETFx(dispatch, option.value);
}

function handlefullNameEnabledSelect(dispatch, option) {
  dispatch(setFullNameEnabled(option.value));
  userDataSETFetch({fullNameEnabled: option.value});
}

export {
  handleGroupSelect,
  handlefullNameEnabledSelect,
}