import { setGroupSchedule } from "../../ReduxStates/Slices/groupScheduleSlice";
import { groupNISETFx } from "../../FxFetches/groupNISETFx";
import { userDataSETFetch } from "../../ReduxStates/Slices/userDataSlice";
import { setFullNameEnabled } from "../../ReduxStates/Slices/fullNameEnabledSlice";

function handleGroupSelect(dispatch, option) {
  groupNISETFx(dispatch, option.value, option.label);
}

function handlefullNameEnabledSelect(dispatch, option) {
  dispatch(setFullNameEnabled(option.value));
  userDataSETFetch({fullNameEnabled: option.value});
}

export {
  handleGroupSelect,
  handlefullNameEnabledSelect,
}