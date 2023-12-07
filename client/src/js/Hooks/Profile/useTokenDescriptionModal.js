import { useState, useEffect } from "react";
import { useInCSSTransition } from "../useInCSSTransition";

export function useTokenDescriptionModal(showDescription, setShowDescription) {
  const [currentImage, setCurrentImage] = useState(0);
  const inCSST = useInCSSTransition(currentImage);

  function close() {
    setShowDescription(false)
  }

  function next() {
    if (currentImage === 4) {
      setCurrentImage(0)
    } else {
      setCurrentImage(currentImage + 1)
    }
  }

  function prev() {
    if (currentImage === 0) {
      setCurrentImage(4)
    } else {
      setCurrentImage(currentImage - 1)
    }
  }

  function current(i) {
    return () => setCurrentImage(i);
  }

  const imageIndex = {
    value: currentImage,
    next: next,
    prev: prev,
    current: current,
  }

  useEffect(() => {
    let scrollPosition = window.pageYOffset; 
    if (showDescription) {
      document.body.style.overflowY = 'scroll';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';

      const handleKeyUp = (e) => {
        if (e.key === 'Escape') {
          close();
          return;
        }
      }
      window.addEventListener('keyup', handleKeyUp);
  
      return () => {
        window.removeEventListener('keyup', handleKeyUp);
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollPosition); 
      setCurrentImage(0);
    }
  }, [showDescription]);

  return { imageIndex, close, inCSST }

}
