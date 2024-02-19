function initializeFishMessage() {
  const newElement = document.createElement('div');
  newElement.className = 'fish-message fish-message__hidden';
  const mark = document.createElement('div');
  mark.className = 'fish-message__info-mark';
  mark.innerHTML = 'ⓘ';
  newElement.appendChild(mark);
  const message = document.createElement('div');
  message.className = 'fish-message__message';
  newElement.appendChild(message);
  document.body.appendChild(newElement);

  return newElement;
}

function handleFishEvent(newElement: HTMLElement, timeoutId: null | NodeJS.Timeout) {
  return (e: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    newElement.className = 'fish-message fish-message__hidden';

    setTimeout(() => {
      const message = newElement.querySelector('.fish-message__message');
      if (message) {
        message.innerHTML = e.detail;
      }
      newElement.className = 'fish-message';

      timeoutId = setTimeout(() => {
        newElement.className = 'fish-message fish-message__hidden';
      }, 5000);
    }, 150);
  };
}

export { initializeFishMessage, handleFishEvent };