import { useState, useEffect } from 'react';
import { Config, Connect, ConnectEvents } from '@vkontakte/superappkit';
import myfetch from '../../utils/myfetch';
import { backendHost, currentHost } from '../../utils/util';
import { userDataStore } from '../../stores/userDataStore';
import { observer } from 'mobx-react';

if (window.location.pathname === '/api/auth/redirect') {
  window.location.href = backendHost + '/api/auth/redirect' + window.location.search;
}

Config.init({
  appId: 51771477, // идентификатор приложения
});

function VkButton() {
  const [authData, setAuthData] = useState<any | null>(null);

  useEffect(() => {
    const vkAuthRedirectURL = currentHost + '/api/auth/redirect';

    const handleAuth = (e: any) => {
      const type = e.type;
      if (!type) return;

      switch (type) {
        case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
          console.log('VK login success');
          setAuthData(e.payload);
          break;
        case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED:
        case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED:
        case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN:
        case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS:
          Connect.redirectAuth({ url: vkAuthRedirectURL });
          break;
        default:
          break;
      }
    };

    const vkOneTapButton = Connect.buttonOneTapAuth({
      callback: handleAuth,
      options: {
        showAlternativeLogin: false,
        displayMode: 'name_phone',
        buttonStyles: {
          borderRadius: 8,
        },
      },
    });

    const vkElementDiv = document.getElementById("vk");
    const frame = vkOneTapButton!.getFrame() as Node;
    vkElementDiv!.appendChild(frame);

    return () => {
      vkElementDiv!.removeChild(frame);
    };
  }, []);

  useEffect(() => {
    async function authorize() {
      if (!authData) return;
      const vkAuthRedirectURL = '/api/authorize';
      await myfetch(
        vkAuthRedirectURL, 
        {
          credentials: 'include',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          body: JSON.stringify({
            silent_token: authData.token,
            uuid: authData.uuid,
          })
        },
        'авторизоваться'
      );
      userDataStore.vkDataGETFetch();
    }

    authorize();
  }, [authData]);

  return (
    <div id="vk" className='vk'></div>
  );
}

export default observer(VkButton);
