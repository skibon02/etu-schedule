import { planningDataSETOneFetch, setOnePlanningData } from "../../ReduxStates/Slices/planningDataSlice";

export function handlePlanningSwitch(dispatch, time_link_id, autoAttendEnabled, setAutoAttendEnabled) {
  setAutoAttendEnabled(!autoAttendEnabled)
  planningDataSETOneFetch(dispatch, time_link_id, !autoAttendEnabled);
  dispatch(setOnePlanningData({t_l_id: time_link_id, f: !autoAttendEnabled}));
}
