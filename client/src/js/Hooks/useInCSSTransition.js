import { useState, useEffect } from 'react';

export function useInCSSTransition(dependency, time = 100) {
  const [inCSST, setInCSST] = useState(true);

  useEffect(() => {
    setInCSST(false);

    const timeout = setTimeout(() => {
      setInCSST(true);
    }, time);

    return () => clearTimeout(timeout);
  }, [dependency]);

  return inCSST;
}
