import { attendanceTokenStore } from "../../stores/attendanceTokenStore";
import ModalTemplate from "./ModalTemplate";

interface InvalidTokenModalProps {
  setInputV: (inputV: string) => void;
  inCSST: boolean;
}

export default function InvalidTokenModal({setInputV, inCSST}: InvalidTokenModalProps) {

  return (
    <ModalTemplate
      showDecline={false}
      titleText={'Похоже, что этот токен больше не подходит. Попробуйте ввести новый.'}
      confirmText={'Отмена'}
      declineText=""
      handleConfirm={() => {
        setInputV('');
        attendanceTokenStore.nullToken();
      }}
      handleDecline={() => {
        setInputV('');
        attendanceTokenStore.nullToken();
      }}
      inCSST={inCSST} />
  )
}
