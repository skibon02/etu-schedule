import {attendanceTokenSETFetch, nullAttendanceToken} from '../../ReduxStates/Slices/attendanceTokenSlice'

async function handleConfirmToken(dispatch, inputV) {
  if (inputV) {
    attendanceTokenSETFetch(dispatch, inputV);
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