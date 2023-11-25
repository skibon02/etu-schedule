import { useDispatch } from 'react-redux'
import { handleDeleteToken } from '../../Handlers/Profile/handleAttendanceToken';

export default function DeleteTokenModal({setShowModal}) {
  const dispatch = useDispatch();

  return (
    <>
    <div style={{fontSize: "2.5em"}} className="are-you-sure">
      <div className="are-you-sure__body">
        <div className="are-you-sure__text">
          Вы уверены, что хотите удалить токен?
        </div>
        <div className="are-you-sure__buttons">
          <div className="are-you-sure__button are-you-sure__button_confirm"
               onClick={() => {
                handleDeleteToken(dispatch);
                setShowModal(false);
              }}>
            Да
          </div>
          <div className="are-you-sure__button are-you-sure__button_cancel"
               onClick={() => setShowModal(false)}>
            Отмена
          </div>
        </div>
      </div>
    </div>
    </>
  )
}