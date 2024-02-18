function handleClockClick(
    isDead, 
    timerId, 
    setToggleClock, 
    setToggleMessage,
    setTimerId,
    setInit,
    needToSHow,
    setNeedToShow
  ) {
  if (!isDead) {
    clearTimeout(timerId);
    setToggleClock(p => !p)
    if (needToSHow) {
      setToggleMessage(true)
      setTimerId(setTimeout(() => {
        setToggleMessage(false)
      }, 5000));
    }
    setNeedToShow(!needToSHow);
    setInit(p => !p);
  }
}

function handleMessageClick(isDead, setToggleMessage) {
  if (!isDead) {
    setToggleMessage(false);
  }
}

export {
  handleClockClick,
  handleMessageClick,
}