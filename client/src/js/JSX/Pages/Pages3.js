import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { useOnlineStatus } from "../../Utils/useOnlineStatus";
import { useDisableImageContextMenu } from "../../Utils/useDisableImageContextMenu";
import { routingFx } from "../../FxFetches/Pages/routingFx";
import { setActiveByLocationFx } from "../../FxFetches/Pages/setActiveByLocationFx";
import { groupScheduleFx } from "../../FxFetches/Pages/groupScheduleFx";
import { vkDataFetch } from "../../ReduxStates/Slices/vkDataSlice";
import { userDataGETFetch } from "../../ReduxStates/Slices/userDataSlice";
import FISH from '../../../icons/fish.svg'
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchRoute from "../NoMatchRoute/NoMatchRoute";
import NoSchedule from "../Schedule/NoSchedule";
import { CSSTransition } from "react-transition-group";

const TRANSITION_TIMEOUT = 300;

export function Pages() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnlineStatus();
  useDisableImageContextMenu();

  const { active } = useSelector(s => s.active);
  const { groupId, groupNILoading } = useSelector(s => s.groupNI);
  const { vkData } = useSelector(s => s.vkData);

  const [fish, setFish] = useState(false);

  useEffect(() => {
    dispatch(vkDataFetch());
    const handleFish = () => setFish(true);
    window.addEventListener('fish', handleFish);
    return () => {
      window.removeEventListener('fish', handleFish);
    };
  }, [dispatch]);

  useEffect(() => {
    routingFx(navigate, location.pathname, vkData);
    if (vkData && vkData.is_authorized && online) {
      dispatch(userDataGETFetch(dispatch));
    }
  }, [dispatch, vkData, online]);

  useEffect(() => {
    if (online) {
      groupScheduleFx(dispatch, groupId, groupNILoading);
    }
  }, [dispatch, groupId, online]);

  useEffect(() => {
    setActiveByLocationFx(dispatch, location)
  }, [dispatch, location]);

  if (!fish) {
    if (!vkData) {
      return <div className="schedule"><NoSchedule groupNumber={1} /></div>
    } else if (!vkData.is_authorized) {
      return (
      <CSSTransition in={active === 'profile'} timeout={TRANSITION_TIMEOUT} classNames={'modal-transition'}>
        <Profile />
      </CSSTransition>
      )
    } else {
        return (
          <div className='container'>
            <div className='under-header-box'></div>
            {vkData.is_authorized && <Header />}
            <Routes>
              <Route path="*" element={<NoMatchRoute />} />
              <Route path="/profile" element={
                <CSSTransition in={active === 'profile'} timeout={TRANSITION_TIMEOUT} classNames={'modal-transition'} unmountOnExit>
                  <Profile />
                </CSSTransition>} />
              <Route path="/schedule" element={
                <CSSTransition in={active === 'schedule'} timeout={TRANSITION_TIMEOUT} classNames={'modal-transition'} unmountOnExit>
                  <Schedule />
                </CSSTransition>} />
              <Route path="/planning" element={
                <CSSTransition in={active === 'planning'} timeout={TRANSITION_TIMEOUT} classNames={'modal-transition'} unmountOnExit>
                  <Planning />
                </CSSTransition>} />
            </Routes>
            <div className='under-header-box-mobile'></div>
          </div>
        )
      }
  } else {
    return <div className="fish"><img className="fish-image" src={FISH} alt="fish" draggable={false} /></div>
  }
}
