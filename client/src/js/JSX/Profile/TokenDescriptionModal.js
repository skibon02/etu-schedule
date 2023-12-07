import { CSSTransition } from "react-transition-group";
import { images, descriptions } from "../../Utils/Profile/infoTokenDescriptionModal";
import { useTokenDescriptionModal } from "../../Hooks/Profile/useTokenDescriptionModal";

export default function TokenDescriptionModal({setShowDescription, showDescription}) {

  const { imageIndex, close, inCSST } = useTokenDescriptionModal(showDescription, setShowDescription)

  return (
    <CSSTransition
      in={showDescription}
      timeout={300}
      classNames={'modal-transition'}
      unmountOnExit >
        <div className="modal-transition images-carousel-modal" onClick={close}>
          <div className="images-carousel-modal__close images-carousel-modal__button" onClick={close}>
            ✖
          </div>
          <div className="images-carousel-modal__body" onClick={(e) => e.stopPropagation()}>
            <div className="images-carousel-modal__current carousel-current">
              <div className="carousel-current__prev images-carousel-modal__button" onClick={imageIndex.prev}>
                {'<'}
              </div>
              <div className="carousel-current__image-container">
                <CSSTransition in={inCSST} timeout={300} classNames={'modal-transition'} unmountOnExit>
                  <>
                  <div className="modal-transition carousel-current__image-description">
                    <div className="carousel-current__image-description-number">{imageIndex.value + 1}</div>
                    <div className="carousel-current__image-description-text">{descriptions[imageIndex.value]}</div>
                  </div>
                  <img 
                    className="modal-transition carousel-current__image" 
                    src={images[imageIndex.value]} 
                    key={imageIndex.value} />
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