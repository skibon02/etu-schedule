import ModalTemplate from "./ModalTemplate";

function LeaderForGroupModal({setShowModal, inCSST}: {
  setShowModal: (value: boolean) => void,
  inCSST: boolean
}) {
  return (
    <ModalTemplate
      showDecline={false}
      titleText={'Чтобы оставлять заметки для группы вам необходимо добавить токен.'}
      confirmText={'Закрыть'}
      declineText={''}
      handleConfirm={() => {
        setShowModal(false);
      }}
      handleDecline={() => {
        setShowModal(false);
      }}
      inCSST={inCSST}
    />
  );
}

export default LeaderForGroupModal;
