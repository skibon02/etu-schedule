import {attendanceTokenSETFetch, nullAttendanceToken} from '../../ReduxStates/Slices/attendanceTokenSlice'
import {groupNIGETFetch} from '../../ReduxStates/Slices/groupNISlice'

async function handleConfirmToken(dispatch, inputV) {
  if (inputV) {
    await attendanceTokenSETFetch(dispatch, inputV);
    groupNIGETFetch(dispatch);
  }
}

async function handleDeleteToken(dispatch) {
  attendanceTokenSETFetch(dispatch, null);
  dispatch(nullAttendanceToken())
}

export {
  handleConfirmToken,
  handleDeleteToken,
}