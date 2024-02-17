import { attendanceTokenStore } from '../../stores/attendanceTokenStore';
import ModalTemplate from './ModalTemplate';

interface DeleteTokenModalProps {
  setShowModal: (value: boolean) => void;
  inCSST: boolean
}

export default function DeleteTokenModal({setShowModal, inCSST}: DeleteTokenModalProps) {

  return (
    <ModalTemplate
      titleText={'Вы уверены, что хотите удалить токен?'}
      confirmText={'Да'}
      declineText={'Отмена'}
      handleConfirm={() => {
        attendanceTokenStore.deleteTokenFetch();
        setShowModal(false);
      }}
      handleDecline={() => {
        setShowModal(false)
      }}
      inCSST={inCSST} />
  )
}