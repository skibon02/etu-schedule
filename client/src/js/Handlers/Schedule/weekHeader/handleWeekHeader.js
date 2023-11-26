import { planningDataSETAllFetch, setAllPlanningData } from "../../../ReduxStates/Slices/planningDataSlice";

function handlePlanning(dispatch, flag) {
  dispatch(setAllPlanningData(flag));
  planningDataSETAllFetch(dispatch, flag);
}

export {
  handlePlanning
}