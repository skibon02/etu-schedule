import { useEffect } from "react";
import { CSSTransition } from "react-transition-group";

export default function ModalTemplate({
  showDecline = true,
  titleText,
  confirmText,
  declineText,
  handleConfirm,
  handleDecline,
  inCSST
}) {

  // esc / enter listeners
  useEffect(() => {
    if (inCSST) {
      const handleKeyUp = (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
          return;
        }
        if (e.key === 'Escape') {
          handleDecline();
          return;
        }
      }
      window.addEventListener('keyup', handleKeyUp);
  
      return () => {
        window.removeEventListener('keyup', handleKeyUp);
      }
    }
  }, [inCSST]);

  return (
    <>
    <CSSTransition 
      in={inCSST}
      timeout={300}
      classNames={'modal-transition'}
      unmountOnExit >
      <div className="are-you-sure modal-transition" onClick={handleDecline}>
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
    </CSSTransition>
    </>
  )
}
