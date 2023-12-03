import { useEffect } from "react";

export default function ModalTemplate({
  showDecline = true,
  titleText,
  confirmText,
  declineText,
  handleConfirm,
  handleDecline
}) {

  // esc / enter listeners
  useEffect(() => {
    const handleEnterUp = (e) => {
      if (e.key === 'Enter') {
        handleConfirm();
      }
    }
    const handleEscUp = (e) => {
      if (e.key === 'Escape') {
        handleDecline();
      }
    }
    
    window.addEventListener('keyup', handleEnterUp);
    window.addEventListener('keyup', handleEscUp);

    return () => {
      window.removeEventListener('keyup', handleEnterUp);
      window.removeEventListener('keyup', handleEscUp)
    }
  }, []);

  return (
    <>
    <div className="are-you-sure" onClick={handleDecline}>
      <div className="are-you-sure__body" onClick={(e) => e.stopPropagation()}>
        <div className="are-you-sure__text">
          {titleText}
        </div>
        <div className="are-you-sure__buttons">
          <div className="are-you-sure__button are-you-sure__button_confirm"
               onClick={handleConfirm}>
            {confirmText}
          </div>
          {showDecline && <div className="are-you-sure__button are-you-sure__button_cancel"
               onClick={handleDecline}>
            {declineText}
          </div>}
        </div>
      </div>
    </div>
    </>
  )
}
