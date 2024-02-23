import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeStore } from '../../stores/activeStore';
import { userDataStore } from '../../stores/userDataStore';
import { dateStore } from '../../stores/dateStore';
import { UserDataGroupTokenService } from '../../services/UserDataGroupTokenService';
import { handleFishEvent, initializeFishMessage } from '../../utils/Router/utils';
import { GroupDateTokenService } from '../../services/GroupDateTokenService';
import { useOnlineStatus } from '../useOnlineStatus';
import { groupStore } from '../../stores/groupStore';
import { attendanceTokenStore } from '../../stores/attendanceTokenStore';

export function useRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const online = useOnlineStatus();

  function setActiveByLocationFx() {
    let loc = location.pathname
    console.log(`location is:\n${loc}`);
    switch (loc) {
      case '/planning':
        activeStore.planning();
        break;
      case '/schedule':
        activeStore.schedule();
        break;
      case '/profile':
        activeStore.profile();
        break;
      default:
        activeStore.profile();
    }
  }

  function routingFx() {
    const loc = location.pathname;
    if (loc === '/' && userDataStore.vkData && userDataStore.vkData.is_authorized) {
      navigate('/schedule');
      return;
    }
    if (userDataStore.vkData  && !userDataStore.vkData.is_authorized) {
      navigate('/profile');
      return;
    }
    if (loc !== '/planning' && loc !== '/profile' && loc !== '/schedule') {
      navigate('/schedule');
      return;
    }
  }

  useEffect(() => {const newElement = initializeFishMessage();
    let timeoutId: null | NodeJS.Timeout = null;
  
    const handleFish = handleFishEvent(newElement, timeoutId);
  
    window.addEventListener('fish', handleFish);
  
    return () => {
      window.removeEventListener('fish', handleFish);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (userDataStore.vkData === null) {
      userDataStore.vkDataGETFetch();
      dateStore.semesterGETFetch();
    }
    routingFx();
    if (userDataStore.vkData && userDataStore.vkData.is_authorized) {
      UserDataGroupTokenService.userDataGetFetch();
      GroupDateTokenService.groupNumberIdGetFetch();
    }
  }, [userDataStore.vkData]);

  useEffect(() => {
    if (online && userDataStore.userId !== null && groupStore.scheduleDiffs !== null && groupStore.schedulePlanning !== null && groupStore.userNotes !== null && groupStore.groupNotes !== null && attendanceTokenStore.attendanceToken !== null) {
      UserDataGroupTokenService.userDataGetFetch();
      // GroupDateTokenService.groupNumberIdGetFetch();
      groupStore.userNotesGETFetch();
      groupStore.groupNotesGETFetch();
      groupStore.scheduleDiffsGETFetch();
      groupStore.schedulePlanningGETFetch();
    } else if (!online) {
      const userDescription = `Похоже, что вы не в сети. Рекомендуем перезагрузить страницу.`;
      const event = new CustomEvent('fish', { detail: userDescription });
      window.dispatchEvent(event);
    }
  }, [online]);

  useEffect(() => {
    setActiveByLocationFx()
  }, [location]);
}
