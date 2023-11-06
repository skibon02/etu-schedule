import { Fragment, useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getVkData, getGroupSchedule } from "../../FxFetches/Pages/Fetches";
import { routingFx } from "../../FxFetches/Pages/RoutingFx";
import { setActiveByLocation } from "../../FxFetches/Pages/SetActiveByLocation";
import { getWeekNumber } from "../../Utils/handleTime";
import Groups from "../../JSX/Groups/Groups";
import Header from "../../JSX/Header/Header";
import Schedule from '../../JSX/Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";

export function Pages() {
  const [date, setDate] = useState(new Date());
  const [active, setActive] = useState('profile');

  const [groupList, setGroupList] = useState(null);
  const [groupListError, setGroupListError] = useState(null);

  const [groupId, setGroupId] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [groupSchedule, setGroupSchedule] = useState(null);

  const [vkData, setVkData] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getVkData(setVkData);
  }, []);

  useEffect(() => {
    routingFx(
      location.pathname,
      vkData,
      setGroupList,
      setGroupListError,
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
    setActiveByLocation(location, setActive)
  }, [location]);

  if (vkData) {
    return (
      <>
      {groupListError && <div>Server troubles: {groupListError}</div>}
      {!groupListError && 
      <div className='container'>
        {active !== 'groups' && <div className='under-header-box'></div>}
        <Routes>
          <Route path="/">
            {(!vkData.is_authorized || active === 'profile') &&
              <Route path="/profile" element={
                <Profile
                  vkData={vkData}
                  setVkData={setVkData}
                  groupList={groupList}
                  setGroupSchedule={setGroupSchedule}
                  setGroupId={setGroupId}
                  setGroupNumber={setGroupNumber}
                  setGroupList={setGroupList} />
              } />
            }
          </Route>
        </Routes>
        {vkData.is_authorized &&
          <Header 
            date={date} 
            setDate={setDate} 
            active={active} 
            setActive={setActive}
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
                    key={groupId} 
                    date={date}
                    groupSchedule={groupSchedule}
                    groupNumber={groupNumber}
                    active={active} />
                  } />
              }
              {active === 'planning' && 
                <Route
                  path="/planning"
                  element={
                    <Planning 
                    groupNumber={groupNumber}
                    groupSchedule={groupSchedule}
                    active={active} />
                  } />
              }
            </Route>
          }
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
      }
      </>
    )
  }
}