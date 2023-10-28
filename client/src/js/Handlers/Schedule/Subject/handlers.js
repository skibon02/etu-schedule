function handleClockClick(
    isDead, 
    timerId, 
    setToggleClock, 
    setToggleMessage,
    toggleClock,
    setTimerId
  ) {
  if (!isDead) {
    clearTimeout(timerId);
    setToggleClock(!toggleClock)
    setToggleMessage(!toggleClock)

    setTimerId(setTimeout(() => {
      setToggleMessage(false)
    }, 5000));
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