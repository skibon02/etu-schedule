import { useState, useEffect } from 'react';
import { Config, Connect, ConnectEvents } from '@vkontakte/superappkit';
import myfetch from '../../utils/myfetch';
import { currentHost } from '../../utils/util';
import { userDataStore } from '../../stores/userDataStore';
import { observer } from 'mobx-react';

// Инициализация конфигурации VK
Config.init({
  appId: 51771477, // идентификатор приложения
});

const SERVER_HOST = currentHost;

function VkButton() {
  const [authData, setAuthData] = useState<any | null>(null);

  // Загрузка данных VK при монтировании компонента
  useEffect(() => {
    userDataStore.vkDataGETFetch();
  }, []);

  // Обработка данных авторизации VK
  useEffect(() => {
    const vkAuthRedirectURL = SERVER_HOST + '/api/auth/redirect';

    // Функция для обработки событий авторизации
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

    // Создание кнопки OneTap VK
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

    if (vkElementDiv) {
      const frame = vkOneTapButton!.getFrame();
      if (frame) {
        vkElementDiv.appendChild(frame);

        return () => {
          if (frame && vkElementDiv.contains(frame)) {
            vkElementDiv.removeChild(frame);
          }
        };
      } else {
        console.error('Failed to get frame from vkOneTapButton.');
      }
    } else {
      console.error('Element with ID "vk" was not found in the document.');
    }
  }, []);

  // Обработка авторизационных данных
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
    }

    authorize();
  }, [authData]);

  return (
    <div id="vk" className='vk'></div>
  );
}

export default observer(VkButton);
