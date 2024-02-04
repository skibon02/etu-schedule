import { Route, Routes } from 'react-router-dom';
import { usePages } from "../../Hooks/Pages/usePages";
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchRoute from "./NoMatchRoute";
import Fish from './Fish';
import NoVkData from './NoVkData';

export default function Pages() {
  const { vkData, fish, maxWeekNumber } = usePages();

  if (fish) {
    return <Fish />
  } else if (!vkData || !maxWeekNumber) {
    return <NoVkData />
  } else if (!vkData.is_authorized) {
    return <Profile />
  } else {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        <Header />
        <Routes>
          <Route path="*" element={<NoMatchRoute />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
    )
  }
}
