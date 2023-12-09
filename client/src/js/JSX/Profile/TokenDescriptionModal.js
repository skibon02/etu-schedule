import { CSSTransition } from "react-transition-group";
import { images, descriptions, origins } from "../../Utils/Profile/infoTokenDescriptionModal";
import { useTokenDescriptionModal } from "../../Hooks/Profile/useTokenDescriptionModal";
import { useState } from "react";

export default function TokenDescriptionModal({setShowDescription, showDescription}) {

  const { imageIndex, close, inCSST, showOrigin, toggleShowOrigin } = useTokenDescriptionModal(showDescription, setShowDescription);

  return (
    <CSSTransition
      in={showDescription}
      timeout={300}
      classNames={'modal-transition'}
      unmountOnExit >
        <div className="modal-transition images-carousel-modal">
          <div className="images-carousel-modal__close images-carousel-modal__button" onClick={close}>
          </div>
          <div className="images-carousel-modal__body" onClick={(e) => e.stopPropagation()}>
            <div className="images-carousel-modal__current carousel-current">
              <div className="carousel-current__prev images-carousel-modal__button" onClick={imageIndex.prev}>
                {'<'}
              </div>
              <div className={showOrigin ? "carousel-current__image-container" : "carousel-current__image-container carousel-current__image-container_description"}>
                <CSSTransition in={inCSST} timeout={180} classNames={'carousel-transition'} unmountOnExit>
                  <>
                  <div className="carousel-transition">
                    {!showOrigin && <div className="carousel-current__image-description">
                      <div className="carousel-current__image-description-number">{imageIndex.value + 1}</div>
                      <div className="carousel-current__image-description-text">{descriptions[imageIndex.value]}</div>
                    </div>}
                    <img
                      onClick={toggleShowOrigin}
                      className={showOrigin ? "carousel-current__image carousel-current__image_zoom-out" : "carousel-current__image"}
                      src={showOrigin ? origins[imageIndex.value] : images[imageIndex.value]} 
                      key={imageIndex.value} />
                  </div>
                  </>
                </CSSTransition>
              </div>
              <div className="carousel-current__next images-carousel-modal__button" onClick={imageIndex.next}>
                {'>'}
              </div>
            </div>
            <div className="images-carousel-modal__all carousel-all">
              {images.map((e, i) => 
                <img 
                  className={imageIndex.value === i ? "carousel-all__image carousel-all__image_active" : "carousel-all__image"} 
                  src={e} 
                  key={i}
                  onClick={imageIndex.current(i)} />
              )}
            </div>
          </div>
        </div>
    </CSSTransition>
  )
}
