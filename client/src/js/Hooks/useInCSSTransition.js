import { useState, useEffect } from 'react';

export function useInCSSTransition(dependency) {
  const [inCSST, setInCSST] = useState(true);

  useEffect(() => {
    setInCSST(false);

    const timeout = setTimeout(() => {
      setInCSST(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, [dependency]);

  return inCSST;
}
