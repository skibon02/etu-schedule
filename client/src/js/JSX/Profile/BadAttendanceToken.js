import { useDispatch } from "react-redux";
import { nullAttendanceToken } from "../../ReduxStates/Slices/attendanceTokenSlice";
import ModalTemplate from "./ModalTemplate";

export default function BadAttendanceToken({setInputV}) {
  const dispatch = useDispatch()

  return (
    <ModalTemplate
      showDecline={false}
      titleText={'Похоже, что этот токен больше не подходит. Попробуйте ввести новый.'}
      confirmText={'Отмена'}
      handleConfirm={() => {
        setInputV('');
        setTimeout(() => {
          dispatch(nullAttendanceToken());
        }, 50); // bc input have onKeyUp binded to Enter and when you click Enter 
        // to close modal it automatically calls setFetch func, bc of async setInputV nature
      }}
      handleDecline={() => {
        setInputV('');
        dispatch(nullAttendanceToken());
      }} />
  )
}