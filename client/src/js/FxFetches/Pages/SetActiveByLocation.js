import { setActive } from "../../ReduxStates/Slices/ActiveSlice";

function setActiveByLocation(dispatch, location) {
  let loc = location.pathname
  console.log(`location is:\n${loc}`);
  if (loc === '/') {
    dispatch(setActive('groups'));
  } else {
    dispatch(setActive(loc.slice(1)));
  }
}

export {
  setActiveByLocation
}