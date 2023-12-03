import { useDispatch } from "react-redux";
import { deauthFetch } from "../../FxFetches/Profile/deauthFetch";
import AreYouSure from "./AreYouSure";

export default function DeauthModal({setShowModal}) {
  const dispatch = useDispatch();

  return (
    <AreYouSure
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