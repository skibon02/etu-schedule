import { useState, useEffect } from 'react';
import { Config } from '@vkontakte/superappkit';
import { vkAuthRedirectURL, oneTapButton } from '../../FxFetches/Profile/VKButton';

// vk id штучка
Config.init({
    appId: 51771477, // идентификатор приложения
});

export default function VkButton() {
	const [authData, setAuthData] = useState(null)

	useEffect(() => {
		vkAuthRedirectURL(authData);
	}, [authData])

	useEffect(() => {
		let vkOneTapButton;
		oneTapButton(setAuthData, vkOneTapButton);

		document.getElementById("vk").appendChild(vkOneTapButton.getFrame())

		return () => {
			document.getElementById("vk").removeChild(vkOneTapButton.getFrame())
		}
	}, []);

	return (
		<div id="vk"></div>
	)
}
