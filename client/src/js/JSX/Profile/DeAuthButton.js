import EXIT from '../../../icons/exit.svg'
import AreYouSure from './AreYouSure';
import { useState } from 'react';

export default function DeAuthButton() {
  const [areYouSure, setAreYouSure] = useState(false);

  return (
    <>
    {areYouSure &&
    <AreYouSure areYouSure={areYouSure} setAreYouSure={setAreYouSure} />
    }
    <div 
      className='deauth-button-container'
      onClick={() => setAreYouSure(!areYouSure)} >
      <div className="deauth-button">
        <img src={EXIT} alt="" className='deauth-button__image' />
        <div className="deauth-button__text-container"><div className='deauth-button__text'>Выйти из профиля</div></div>
        <div className="loader"></div>
      </div>
    </div>
    </>
  )
}