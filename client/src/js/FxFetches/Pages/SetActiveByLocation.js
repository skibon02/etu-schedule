function setActiveByLocation(location, setActive) {
  let loc = location.pathname
  console.log(`location is:\n${loc}`);
  if (loc === '/') {
    setActive('groups');
  } else {
    setActive(loc.slice(1));
  }
}

export {
  setActiveByLocation
}