import { setDate } from "../../ReduxStates/Slices/dateSLice";
const weekTime = 24 * 60 * 60 * 1000 * 7;

function handleNextWeek(dispatch, date, weekNumber, maxWeekNumber) {
  if (weekNumber < maxWeekNumber) {
    dispatch(
      setDate( (new Date(date.getTime() + weekTime)).toISOString() )
    )
    return;
  }
}

function handleCurrentWeek(dispatch) {
  dispatch(setDate((new Date()).toISOString()))
  return;
}

function handlePrevWeek(dispatch, date, weekNumber) {
  if (weekNumber > 0) {
    dispatch(
      setDate( (new Date(date.getTime() - weekTime)).toISOString() )
    );
    return;
  }
}

export {
  handleCurrentWeek, 
  handleNextWeek,  
  handlePrevWeek,
}