import { Fragment, useEffect, useState } from "react";
import React from "react";
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getGroupList, getGroupSchedule, getVkData } from "../../FxFetches/Pages/Fetches";
import Groups from "../../JSX/Groups/Groups";
// import VkButton from "../../JSX/Profile/VKButton";
// import VkButton from "../../JSX/Profile/VKButton_old_v";
import Header from "../../JSX/Header/Header";
import Schedule from '../../JSX/Schedule/Schedule'
// import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { setActiveByLocation } from "../../FxFetches/Pages/SetActiveByLocation";
// import makeSchedule from "@src/js/Utils/Schedule/parseSchedule.js";
import { getWeekNumber } from "../../Utils/handleTime";
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";

export function Pages() {
  const [date, setDate] = useState(new Date());
  const [active, setActive] = useState('groups');

  const [groupList, setGroupList] = useState(null);
  const [groupListError, setGroupListError] = useState(null);
  
  const [groupId, setGroupId] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [groupSchedule, setGroupSchedule] = useState(null);

  const [vkData, setVkData] = useState({is_authorized: false});

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getVkData(setVkData);
    if (window.localStorage.getItem("groupId") !== null) {
      setGroupId(window.localStorage.getItem("groupId"))
      setGroupNumber(window.localStorage.getItem("groupNumber"))
      navigate('/schedule');
    } else {
      navigate('/');
    }
    getGroupList(setGroupList, setGroupListError);
  }, []);

  useEffect(() => {
    setActiveByLocation(location, setActive)
  }, [location]);

  useEffect(() => {
    console.log(groupId);
    getGroupSchedule(groupId, setGroupSchedule)
  }, [groupId]);

  return (
    <>
    {groupListError && <div>Server troubles: {groupListError}</div>}
    {!groupListError && 
    <div className='container'>
      {active !== 'groups' && active !== 'profile' && <div className='under-header-box'></div>}
      <Routes>
        {(!groupSchedule && !groupId || active === 'groups') && 
        <Route 
          path="/"
          element={
          <Groups 
            setGroupId={setGroupId}
            setActive={setActive}
            groupList={groupList}
            setGroupNumber={setGroupNumber}
            setGroupSchedule={setGroupSchedule}
            vkData={vkData} />} />
          
        }
      </Routes>
        {groupSchedule && groupId &&
        <>
          {active !== 'groups' &&
            <Header 
              date={date} 
              setDate={setDate} 
              active={active} 
              setActive={setActive}
              setGroupSchedule={setGroupSchedule}
              setGroupId={setGroupId}
              weekNumber={getWeekNumber(date)}
            />
          }
          <Routes>
          <>
            {active === 'schedule' && 
            <Route 
              path="/schedule"
              element={
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
                }
              />
            }
            {active === 'profile' && 
              <Route 
                path="/profile"
                element={
                  <Profile
                    vkData={vkData}
                    setVkData={setVkData} />
                }
              />
            }
          </>
          </Routes>
        </>
        }
      {groupSchedule && active !== 'profile' &&
        <div className='under-header-box-mobile'></div>
      }
    </div>}
    </>
  )
}