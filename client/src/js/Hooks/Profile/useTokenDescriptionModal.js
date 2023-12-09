import { useState, useEffect } from "react";
// import { useInCSSTransition } from "../useInCSSTransition";

export function useTokenDescriptionModal(showDescription, setShowDescription) {
  const [currentImage, setCurrentImage] = useState(0);
  const [inCSST, setInCSST] = useState(true);
  const [showOrigin, setShowOrigin] = useState(false);

  function toggleShowOrigin() {
    setShowOrigin(!showOrigin);
  }

  function close() {
    setShowDescription(false)
  }

  function next() {
    setInCSST(false);
    setShowOrigin(false);
    setTimeout(() => {
      setInCSST(true)
      setCurrentImage(currentImage === 4 ? 0 : currentImage + 1)
    }, 180);
  }

  function prev() {
    setInCSST(false);
    setShowOrigin(false);
    setTimeout(() => {
      setInCSST(true)
      setCurrentImage(currentImage === 0 ? 4 : currentImage - 1)
    }, 180);
  }

  function current(i) {
    return () => {
      setInCSST(false);
      setShowOrigin(false);
      setTimeout(() => {
        setInCSST(true)
        setCurrentImage(i)
      }, 180);
    };
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
        if (e.key === 'ArrowLeft') {
          prev();
          return;
        }
        if (e.key === 'ArrowRight') {
          next();
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
  }, [showDescription, currentImage]);

  return { imageIndex, close, inCSST, showOrigin, toggleShowOrigin }
}
