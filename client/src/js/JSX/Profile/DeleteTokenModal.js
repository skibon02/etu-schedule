import { useDispatch } from 'react-redux'
import { handleDeleteToken } from '../../Handlers/Profile/handleAttendanceToken';
import AreYouSure from './AreYouSure';

export default function DeleteTokenModal({setShowDeleteTokenModal}) {
  const dispatch = useDispatch();

  return (
    <AreYouSure
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