import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '../useOnlineStatus';
import { useState, useEffect } from 'react';
import { vkDataFetch } from '../../ReduxStates/Slices/vkDataSlice';
import { routingFx } from '../../FxFetches/Pages/routingFx';
import { userDataGETFetch } from '../../ReduxStates/Slices/userDataSlice';
import { groupScheduleFx } from '../../FxFetches/Pages/groupScheduleFx';
import { setActiveByLocationFx } from '../../FxFetches/Pages/setActiveByLocationFx';

export function usePages() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const { groupId, groupNILoading } = useSelector(s => s.groupNI);
  const { vkData } = useSelector(s => s.vkData);

  const [fish, setFish] = useState(false);

  useEffect(() => {
    dispatch(vkDataFetch());
    const handleFish = () => setFish(true);
    window.addEventListener('fish', handleFish);
    return () => window.removeEventListener('fish', handleFish);
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
  }, [dispatch, groupId, groupNILoading, online]);

  useEffect(() => {
    setActiveByLocationFx(dispatch, location)
  }, [dispatch, location]);

  return { vkData, fish };
}

