import { useDispatch } from 'react-redux'
import { handleDeleteToken } from '../../Handlers/Profile/handleAttendanceToken';
import ModalTemplate from './ModalTemplate';

export default function DeleteTokenModal({setShowDeleteTokenModal}) {
  const dispatch = useDispatch();

  return (
    <ModalTemplate
      titleText={'Вы уверены, что хотите удалить токен?'}
      confirmText={'Да'}
      declineText={'Отмена'}
      handleConfirm={() => {
        handleDeleteToken(dispatch);
        setShowDeleteTokenModal(false);
      }}
      handleDecline={() => setShowDeleteTokenModal(false)} />
  )
}