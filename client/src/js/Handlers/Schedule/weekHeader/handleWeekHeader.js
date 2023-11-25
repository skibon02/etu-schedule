import { planningDataSETAllFetch, setAllPlanningData } from "../../../ReduxStates/Slices/planningDataSlice";

function handlePlanning(dispatch, groupSchedule, flag) {
  dispatch(setAllPlanningData(flag));
  planningDataSETAllFetch(dispatch, groupSchedule, flag);
}

export {
  handlePlanning
}