import { Fragment, useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { getGroupSchedule } from "../../FxFetches/Pages/Fetches";
import { routingFx } from "../../FxFetches/Pages/RoutingFx";
import { setActiveByLocation } from "../../FxFetches/Pages/SetActiveByLocation";
import { getWeekNumber } from "../../Utils/handleTime";
import Header from "../../JSX/Header/Header";
import Schedule from '../../JSX/Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import { vkDataFetch } from "../../ReduxStates/Slices/vkDataSlice";

export function Pages() {
  const dispatch = useDispatch();

  const [date, setDate] = useState(new Date());
  const {active} = useSelector(s => s.active);

  const [groupId, setGroupId] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [groupSchedule, setGroupSchedule] = useState(null);

  const { vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);

  const [accessToken, setAccessToken] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // getVkData(setVkData);
    dispatch(vkDataFetch());
  }, []);

  useEffect(() => {
    routingFx(
      location.pathname,
      vkData,
      navigate,
      setGroupId,
      setGroupNumber
    )
  }, [vkData, localStorage.getItem('groupNumber')]);

  useEffect(() => {
    getGroupSchedule(groupId, setGroupSchedule);
    console.log('group id:');
    console.log(groupId);
  }, [groupId])

  useEffect(() => {
    setActiveByLocation(dispatch, location)
  }, [location]);

  if (vkData) {
    return (
      <>
      <div className='container'>
        {active !== 'groups' && <div className='under-header-box'></div>}
        <Routes>
          <Route path="/">
            {(!vkData.is_authorized || active === 'profile') &&
              <Route path="/profile" element={
                <Profile
                  setGroupSchedule={setGroupSchedule}
                  setGroupId={setGroupId}
                  setGroupNumber={setGroupNumber}
                  setAccessToken={setAccessToken} 
                  accessToken={accessToken} />
              } />
            }
          </Route>
        </Routes>
        {vkData.is_authorized &&
          <Header 
            date={date} 
            setDate={setDate} 
            setGroupSchedule={setGroupSchedule}
            setGroupId={setGroupId}
            weekNumber={getWeekNumber(date)}
            groupSchedule={groupSchedule} />
        }
        <Routes>
          {vkData.is_authorized &&
          <Route path="/">
              {active === 'schedule' &&
                <Route path="/schedule" element={
                  <Schedule 
                    date={date}
                    groupSchedule={groupSchedule}
                    groupNumber={groupNumber} />
                  } />
              }
              {active === 'planning' && 
                <Route
                  path="/planning"
                  element={
                    <Planning 
                      groupNumber={groupNumber}
                      groupSchedule={groupSchedule} />
                  } />
              }
            </Route>
          }
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
      </>
    )
  } else {
    return <div>сервер лёг брух</div>
  }
}