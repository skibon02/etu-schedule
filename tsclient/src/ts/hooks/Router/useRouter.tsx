import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeStore } from '../../stores/activeStore';
import { userDataStore } from '../../stores/userDataStore';
import { dateStore } from '../../stores/dateStore';
import { UserDataGroupTokenService } from '../../services/UserDataGroupTokenService';
import { GroupDateService } from '../../services/GroupDateService';

export function useRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  const [renderStatus, setRenderStatus] = useState<'loading' | 'notAuth' | 'ready'>('loading');

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

  useEffect(() => {
    userDataStore.vkDataGETFetch();
    dateStore.semesterGETFetch();
    const handleFish = (e: any) => {
      const newElement = document.createElement('div');
      newElement.className = 'fish-message';
      newElement.innerHTML = e.detail;
      document.body.appendChild(newElement);
    }
    window.addEventListener('fish', handleFish);
    return () => window.removeEventListener('fish', handleFish);
  }, []);

  useEffect(() => {
    routingFx();
    if (userDataStore.vkData && userDataStore.vkData.is_authorized) {
      UserDataGroupTokenService.userDataGetFetch();
      GroupDateService.groupNumberIdGetFetch();
    }
  }, [userDataStore.vkData]);

  useEffect(() => {
    setActiveByLocationFx()
  }, [location]);

  // я не дебил, тут должно быть 2 loading, их не стоит объединять в 1 if
  useEffect(() => {
    if (dateStore.semesterStart === null) {
      setRenderStatus('loading');
    } else if (userDataStore.vkData === null) {
      setRenderStatus('loading');
    } else if (!userDataStore.vkData!.is_authorized) {
      setRenderStatus('notAuth');
    } else if (userDataStore.vkData !== null && dateStore.semesterStart !== null) {
      setRenderStatus('ready');
    }
  }, [userDataStore.vkData, dateStore.semesterStart]);

  return { renderStatus };
}

