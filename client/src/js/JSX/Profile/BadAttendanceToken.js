import { useDispatch } from "react-redux";
import { nullAttendanceToken } from "../../ReduxStates/Slices/attendanceTokenSlice";
import AreYouSure from "./AreYouSure";

export default function BadAttendanceToken() {
  const dispatch = useDispatch()

  return (
    <AreYouSure
      showDecline={false}
      titleText={'Похоже, что этот токен больше не подходит. Попробуйте ввести новый.'}
      confirmText={'Отмена'}
      handleConfirm={() => {
        dispatch(nullAttendanceToken());
      }}
      handleDecline={() => {
        dispatch(nullAttendanceToken());
      }} />
  )
}