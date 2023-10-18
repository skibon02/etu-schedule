import { useState, useEffect } from 'react';

import { isdev, currentHost } from '../functions/util';

import { Config, Connect, ConnectEvents } from '@vkontakte/superappkit';
import myfetch from "../functions/myfetch";


// vk id штучка
Config.init({
    appId: 51771477, // идентификатор приложения
});

const SERVER_HOST = currentHost;


export default function VkButton() {

    const [authData, setAuthData] = useState(null);
    useEffect(() => {
        const vkAuthRedirectURL = '/api/authorize';
        if (authData) {
            myfetch(vkAuthRedirectURL, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    silent_token: authData.token,
                    uuid: authData.uuid,
                })
            });
        }
    },[authData])

    useEffect(() => {
        const vkAuthRedirectURL = SERVER_HOST+'/api/auth/redirect';
        const vkOneTapButton = Connect.buttonOneTapAuth({
            // Обязательный параметр в который нужно добавить обработчик событий приходящих из SDK
            callback: function(e) {
                const type = e.type;

                if (!type) {
                    return false;
                }

                switch (type) {
                    case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS: // = 'VKSDKOneTapAuthLoginSuccess'
                        // Пользователь успешно авторизовался
                        console.log('мегахорош, ты вошел через вк, ' + e.payload.user.first_name + " " + e.payload.user.last_name + " с вк айди " + e.payload.user.id)
                        console.log('> by Github Copilot: небойся ошибок, они не страшны')

                        // redirect
                        setAuthData(e.payload)
                        return false

                    // Для этих событий нужно открыть полноценный VK ID чтобы
                    // пользователь дорегистрировался или подтвердил телефон
                    case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED: //  = 'VKSDKOneTapAuthFullAuthNeeded'
                    case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED: // = 'VKSDKOneTapAuthPhoneValidationNeeded'
                    case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN: // = 'VKSDKButtonOneTapAuthShowLogin'
                        return Connect.redirectAuth({ url: vkAuthRedirectURL, state: 'from_vk_page'}); // url - строка с url, на который будет произведён редирект после авторизации.
                    // state - состояние вашего приложение или любая произвольная строка, которая будет добавлена к url после авторизации.
                    // Пользователь перешел по кнопке "Войти другим способом"
                    case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS: // = 'VKSDKButtonOneTapAuthShowLoginOptions'
                        // Параметр url: ссылка для перехода после авторизации. Должен иметь https схему. Обязательный параметр.
                        return Connect.redirectAuth({ url: vkAuthRedirectURL });
                }

                return false;
            },
            // Не обязательный параметр с настройками отображения OneTap
            options: {
                showAlternativeLogin: false, // Отображение кнопки "Войти другим способом"
                displayMode: 'name_phone', // Режим отображения кнопки 'default' | 'name_phone' | 'phone_name'
                buttonStyles: {
                    borderRadius: 8, // Радиус скругления кнопок
                },
            },
        });

        document.body.appendChild(vkOneTapButton.getFrame())

        return () => {
            document.body.removeChild(vkOneTapButton.getFrame())
        }
    }, []);

    return (
        <div id="vk"></div>
    )
}
