import { setActive } from "../../ReduxStates/Slices/activeSlice";

function setActiveByLocationFx(dispatch, location) {
  let loc = location.pathname
  console.log(`location is:\n${loc}`);
  dispatch(setActive(loc.slice(1)));
}

export {
  setActiveByLocationFx
}