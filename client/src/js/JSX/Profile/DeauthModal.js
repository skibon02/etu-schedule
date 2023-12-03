import { useDispatch } from "react-redux";
import { deauthFetch } from "../../FxFetches/Profile/deauthFetch";
import ModalTemplate from "./ModalTemplate";

export default function DeauthModal({setShowModal}) {
  const dispatch = useDispatch();

  return (
    <ModalTemplate
      titleText={'Вы уверены, что хотите выйти?'}
      confirmText={'Да'}
      declineText={'Отмена'}
      handleConfirm={() => {
        deauthFetch(dispatch);
        setShowModal(false);
      }}
      handleDecline={() => setShowModal(false)} />
  )
}