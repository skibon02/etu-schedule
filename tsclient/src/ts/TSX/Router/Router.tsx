import { observer } from 'mobx-react';
import { Route, Routes } from 'react-router-dom';
import { useRouter } from '../../hooks/Router/useRouter';
import { DataFlowService } from '../../services/DataFlowService';
import Header from "../Header/Header";
import Planning from "../Planning/Planning";
import Profile from "../Profile/Profile";
import NoMatchingRoute from './NoMatchingRoute';
import Schedule from '../Shedule/Schedule';
import Loading from './Loading';

function Router() {
  useRouter();

  if (DataFlowService.renderStatus === 'loading') {
    return <Loading />
  } else if (DataFlowService.renderStatus === 'notAuth') {
    return <Profile />
  } else {
    return (
      <div className='container'>
        <div className='under-header-box'></div>
        <Header />
        <Routes>
          <Route path="*" element={<NoMatchingRoute />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/planning" element={<Planning />} />
        </Routes>
        <div className='under-header-box-mobile'></div>
      </div>
    )
  }
}

export default observer(Router);
