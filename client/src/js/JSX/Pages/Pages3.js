import { Route, Routes } from 'react-router-dom';
import { usePages } from "../../Utils/Hooks/usePages";
import FISH from '../../../icons/fish.svg'
import Header from "../Header/Header";
import Schedule from '../Schedule/Schedule'
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchRoute from "../NoMatchRoute/NoMatchRoute";
import NoSchedule from "../Schedule/NoSchedule";

export default function Pages() {
  const { vkData, fish } = usePages();

  if (fish) {
    return <div className="fish"><img className="fish-image" src={FISH} alt="fish" draggable={false} /></div>
  } else if (!vkData) {
    return <div className="container"><NoSchedule groupNumber={1} /></div>
  } else if (!vkData.is_authorized) {
    return <Profile />
  } else {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        {vkData.is_authorized && <Header />}
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
