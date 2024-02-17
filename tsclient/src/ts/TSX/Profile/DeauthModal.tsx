import ModalTemplate from "./ModalTemplate";
import { ResetService } from "../../services/ResetService"

interface DeauthModalProps {
  setShowModal: (value: boolean) => void;
  showModal: boolean
}

export default function DeauthModal({setShowModal, showModal}: DeauthModalProps) {

  return (
    <ModalTemplate
      titleText={'Вы уверены, что хотите выйти?'}
      confirmText={'Да'}
      declineText={'Отмена'}
      handleConfirm={() => {
        ResetService.deauthFetch();
        setShowModal(false);
      }}
      handleDecline={() => setShowModal(false)}
      inCSST={showModal} />
  )
}