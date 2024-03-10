import { CSSTransition } from "react-transition-group";
import { images, descriptions, origins, minies } from "../../utils/Profile/infoTokenDescriptionModal";
import { useTokenDescriptionModal } from "../../hooks/Profile/useTokenDescriptionModal";

interface TokenDescriptionModalProps {
  setShowDescription: (value: boolean) => void
  showDescription: boolean
}

export default function TokenDescriptionModal({setShowDescription, showDescription}: TokenDescriptionModalProps) {

  const { imageIndex, close, inCSST, showOrigin, toggleShowOrigin } = useTokenDescriptionModal(showDescription, setShowDescription);

  return (
    <CSSTransition
      in={showDescription}
      timeout={300}
      classNames={'modal-transition'}
      unmountOnExit >
        <div className="modal-transition images-carousel-modal">
          <div className="images-carousel-modal__close images-carousel-modal__button" role="button" onClick={close}>
          </div>
          <div className="images-carousel-modal__body" role="button" onClick={(e) => e.stopPropagation()}>
            <div className="images-carousel-modal__current carousel-current">
              <div className="carousel-current__prev images-carousel-modal__button" role="button" onClick={imageIndex.prev}>
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
                      role="button" onClick={toggleShowOrigin}
                      className={showOrigin ? "carousel-current__image carousel-current__image_zoom-out" : "carousel-current__image"}
                      src={showOrigin ? origins[imageIndex.value] : images[imageIndex.value]} 
                      key={imageIndex.value} />
                  </div>
                  </>
                </CSSTransition>
              </div>
              <div className="carousel-current__next images-carousel-modal__button" role="button" onClick={imageIndex.next}>
                {'>'}
              </div>
            </div>
            <div className="images-carousel-modal__all carousel-all">
              {minies.map((e, i) => 
                <img 
                  className={imageIndex.value === i ? "carousel-all__image carousel-all__image_active" : "carousel-all__image"} 
                  src={e} 
                  key={i}
                  role="button" onClick={imageIndex.current(i)} />
              )}
            </div>
          </div>
        </div>
    </CSSTransition>
  )
}
