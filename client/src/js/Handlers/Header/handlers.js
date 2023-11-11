import { setDate } from "../../ReduxStates/Slices/dateSLice";
const weekTime = 24 * 60 * 60 * 1000 * 7;

function handleNextWeek(dispatch, date, weekNumber) {
  if (weekNumber < 17) {
    dispatch(setDate(new Date(date.getTime() + weekTime)))
  }
}

function handleCurrentWeek(dispatch) {
  dispatch(setDate(new Date()))
}

function handlePrevWeek(dispatch, date, weekNumber) {
  if (weekNumber > 0) {
    dispatch(setDate(new Date(date.getTime() - weekTime)))
  }
}



export {
  handleCurrentWeek, 
  handleNextWeek,  
  handlePrevWeek,
}