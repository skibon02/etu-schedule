import { useDispatch } from "react-redux";
import { nullAttendanceToken } from "../../ReduxStates/Slices/attendanceTokenSlice";
import ModalTemplate from "./ModalTemplate";

export default function BadAttendanceTokenModal({setInputV, inCSST}) {
  const dispatch = useDispatch()

  return (
    <ModalTemplate
      showDecline={false}
      titleText={'Похоже, что этот токен больше не подходит. Попробуйте ввести новый.'}
      confirmText={'Отмена'}
      handleConfirm={() => {
        setInputV('');
        dispatch(nullAttendanceToken());
      }}
      handleDecline={() => {
        setInputV('');
        dispatch(nullAttendanceToken());
      }}
      inCSST={inCSST} />
  )
}
