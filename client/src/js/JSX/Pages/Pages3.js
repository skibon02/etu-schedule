import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { routingFx } from "../../FxFetches/Pages/routingFx";
import { setActiveByLocationFx } from "../../FxFetches/Pages/setActiveByLocationFx";
import { groupScheduleFx } from "../../FxFetches/Pages/groupScheduleFx";
import { vkDataFetch } from "../../ReduxStates/Slices/vkDataSlice";
import { userDataGETFetch } from "../../ReduxStates/Slices/userDataSlice";
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchRoute from "../NoMatchRoute/NoMatchRoute";

export function Pages() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const {active} = useSelector(s => s.active);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);
  sessionStorage.setItem('fish', 0);

  useEffect(() => {
    dispatch(vkDataFetch());
  }, [dispatch]);

  useEffect(() => {
    routingFx(navigate, location.pathname, vkData);
    if (vkData && vkData.is_authorized) {
      dispatch(userDataGETFetch(dispatch));
    }
  }, [dispatch, vkData]);

  useEffect(() => {
    groupScheduleFx(dispatch, groupId);
  }, [dispatch, groupId]);

  useEffect(() => {
    setActiveByLocationFx(dispatch, location)
  }, [dispatch, location]);

  if (vkData && !(sessionStorage.getItem('fish') === '1')) {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        {vkData.is_authorized && <Header />}
        <Routes>
          <Route path="*" element={<NoMatchRoute />} />
          {(!vkData.is_authorized || active === 'profile') &&
            <Route path="/profile" element={<Profile />} />
          }
          {vkData.is_authorized &&
          <>
          {active === 'schedule' &&
            <Route path="/schedule" element={<Schedule />} />
          }
          {active === 'planning' && 
            <Route path="/planning" element={<Planning />} />
          }
          </>
          }
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
    )
  } else {
    return <div className="fish">fish</div>
  }
}
