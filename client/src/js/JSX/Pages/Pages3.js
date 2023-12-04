import { Route, Routes } from 'react-router-dom';
import { CSSTransition } from "react-transition-group";
import { usePages } from "../../Utils/Hooks/usePages";
import FISH from '../../../icons/fish.svg'
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchRoute from "../NoMatchRoute/NoMatchRoute";
import NoSchedule from "../Schedule/NoSchedule";

export function Pages() {
  const { active, vkData, fish } = usePages();

  if (fish) {
    return <div className="fish"><img className="fish-image" src={FISH} alt="fish" draggable={false} /></div>
  } else if (!vkData) {
    return <div className="schedule"><NoSchedule groupNumber={1} /></div>
  } else if (!vkData.is_authorized) {
    return <Profile />
  } else {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        {vkData.is_authorized && <Header />}
        <Routes>
          <Route path="*" element={<NoMatchRoute />} />
          <Route path="/profile" element={
            <CSSTransition in={active === 'profile'} timeout={300} classNames={'modal-transition'} unmountOnExit>
              <Profile />
            </CSSTransition>} />
          <Route path="/schedule" element={
            <CSSTransition in={active === 'schedule'} timeout={300} classNames={'modal-transition'} unmountOnExit>
              <Schedule />
            </CSSTransition>} />
          <Route path="/planning" element={
            <CSSTransition in={active === 'planning'} timeout={300} classNames={'modal-transition'} unmountOnExit>
              <Planning />
            </CSSTransition>} />
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
    )
  }
}
