import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { routingFx } from "../../FxFetches/Pages/RoutingFx";
import { setActiveByLocation } from "../../FxFetches/Pages/SetActiveByLocation";
import { vkDataFetch } from "../../ReduxStates/Slices/vkDataSlice";
import { groupScheduleFetch } from "../../ReduxStates/Slices/groupScheduleSlice";
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";

export function Pages() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const {active} = useSelector(s => s.active);
  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);

  useEffect(() => {
    dispatch(vkDataFetch());
  }, [dispatch]);

  useEffect(() => {
    routingFx(navigate, dispatch, location.pathname, vkData)
  }, [dispatch, vkData, localStorage.getItem('groupNumber')]);

  useEffect(() => {
    if (groupId) {
      dispatch(groupScheduleFetch(groupId));
    }
  }, [dispatch, groupId])

  useEffect(() => {
    setActiveByLocation(dispatch, location)
  }, [dispatch, location]);

  if (vkData) {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        <Routes>
          {(!vkData.is_authorized || active === 'profile') &&
            <Route path="/profile" element={<Profile />} />
          }
        </Routes>
        {vkData.is_authorized &&
          <Header  />
        }
        <Routes>
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
