import EXIT from '../../../icons/exit.svg'
import { useState } from 'react';
import DeauthModal from './DeauthModal';

export default function DeAuthButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
    {showModal && <DeauthModal setShowModal={setShowModal} />}
    <div 
      className='deauth-button-container'
      onClick={() => setShowModal(true)} >
      <div className="deauth-button">
        <img src={EXIT} alt="" className='deauth-button__image' />
        <div className="deauth-button__text-container"><div className='deauth-button__text'>Выйти из профиля</div></div>
        <div className="loader"></div>
      </div>
    </div>
    </>
  )
}