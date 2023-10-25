import { useEffect, useState } from "react";
// import { Route, Routes } from 'react-router-dom';
import { getGroupList, getGroupSchedule } from "../../Fetches/Pages/GroupList";
import Groups from "../../JSX/Groups/Groups";
// import VkButton from "../../JSX/Profile/VKButton";
import VkButton from "../../JSX/Profile/VKButton_old_v";
import Header from "../../JSX/Header/Header";
import Schedule from '../../JSX/Schedule/Schedule'
import makeSchedule from "../../Utils/Schedule/parseSchedule";
// import makeSchedule from "@src/js/Utils/Schedule/parseSchedule.js";

export function Pages() {
  const [date, setDate] = useState(new Date());
  const [active, setActive] = useState('groups');

  const [groupList, setGroupList] = useState(null);
  const [groupListError, setGroupListError] = useState(null);
  
  const [groupId, setGroupId] = useState(null);
  const [groupNumber, setGroupNumber] = useState(null);
  const [groupSchedule, setGroupSchedule] = useState(null);

  useEffect(() => {
    getGroupList(setGroupList, setGroupListError);
  }, []);

  useEffect(() => {
    console.log(groupId);
    getGroupSchedule(groupId, setGroupSchedule)
  }, [groupId]);



  return (
    <>
    {groupListError && <div>Server troubles: {groupListError}</div>}
    {!groupListError && 
    <div className='container'>
      {active !== 'groups' && <div className='under-header-box'></div>}
      {/* <Routes> */}
        {(!groupSchedule && !groupId || active === 'groups') && 
        // <Route path="/groups">
          <Groups 
            setGroupId={setGroupId}
            setActive={setActive}
            groupList={groupList}
            setGroupNumber={setGroupNumber} />
        // </Route> 
        }
        {groupSchedule && groupId &&
          <>
          <Header 
            date={date} 
            setDate={setDate} 
            active={active} 
            setActive={setActive}
            setGroupSchedule={setGroupSchedule}
            setGroupId={setGroupId}
            weekNumber={makeSchedule(groupSchedule, date)[1]}
          />
          {active === 'schedule' && 
          <>
          {/* <Route path="/schedule"> */}
            <Schedule 
              key={groupId} 
              date={date}
              groupSchedule={groupSchedule}
              groupNumber={groupNumber} />
          {/* </Route> */}
          </>
          }
          {/* <Route path="/planning"> */}
            {active === 'planning' && <div>123</div>}
          {/* </Route> */}
          {/* <Route path="/profile"> */}
            {active === 'profile' && <VkButton />}
          {/* </Route> */}
          {groupSchedule && <div className='under-header-box-mobile'></div>}
          </>
        }
      {/* </Routes> */}
    </div>}
    </>
  )
}