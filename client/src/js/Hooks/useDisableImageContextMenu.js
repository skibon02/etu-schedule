import { useEffect } from 'react';

export function useDisableImageContextMenu() {
  useEffect(() => {
    const disableImageContextMenu = (event) => {
      if (event.target.tagName === 'IMG') {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', disableImageContextMenu);

    return () => {
      document.removeEventListener('contextmenu', disableImageContextMenu);
    };
  }, []);
}
