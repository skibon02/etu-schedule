import { useDispatch } from "react-redux";
import { nullAttendanceToken } from "../../ReduxStates/Slices/attendanceTokenSlice";

export default function BadAttendanceToken({setInputV}) {
  const dispatch = useDispatch()

  return (
    <>
    <div style={{fontSize: "2.5em"}} className="are-you-sure">
      <div className="are-you-sure__body">
        <div className="are-you-sure__text">
          Похоже, что этот токен больше не подходит. Попробуйте ввести новый.
        </div>
        <div className="are-you-sure__buttons">
          <div className="are-you-sure__button are-you-sure__button_confirm"
               onClick={() => {
                dispatch(nullAttendanceToken());
                setInputV('');
              }}>
            Закрыть
          </div>
        </div>
      </div>
    </div>
    </>
  );
}