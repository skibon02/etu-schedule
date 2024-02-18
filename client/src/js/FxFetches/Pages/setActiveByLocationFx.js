import { setActive } from "../../ReduxStates/Slices/activeSlice";

function setActiveByLocationFx(dispatch, location) {
  let loc = location.pathname
  console.log(`location is:\n${loc}`);
  dispatch(setActive(loc.slice(1)));
  // switch (loc) {
  //   case '/planning':
  //     document.title = 'Планирование';
  //     break;
  //   case '/schedule':
  //     document.title = 'Расписание';
  //     break;
  //   case '/profile':
  //     document.title = 'Профиль';
  //     break;
  // }
}

export {
  setActiveByLocationFx
}