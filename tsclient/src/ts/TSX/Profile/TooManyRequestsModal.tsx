import { attendanceTokenStore } from "../../stores/attendanceTokenStore";
import ModalTemplate from "./ModalTemplate";

interface TooManyRequestsModalProps {
  inCSST: boolean;
}

export default function TooManyRequestsModal({inCSST}: TooManyRequestsModalProps) {

  return (
    <ModalTemplate
      showDecline={false}
      titleText={'Кажется, на сервер поступает слишком много запросов. Попробуйте позже.'}
      confirmText={'Закрыть'}
      declineText=""
      handleConfirm={() => {
        attendanceTokenStore.resetTooManyRequests();
      }}
      handleDecline={() => {
        attendanceTokenStore.resetTooManyRequests();
      }}
      inCSST={inCSST} />
  )
}
