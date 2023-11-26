import { handleConfirmToken } from "./handleAttendanceToken"

function handleEnterUp(dispatch, inputV, e) {
  if (e.key === 'Enter') {
    handleConfirmToken(dispatch, inputV)
  }
};

export {
  handleEnterUp,
}
