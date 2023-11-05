import EXIT from '../../../icons/exit.svg'
import {deauth} from '../../FxFetches/Profile/DeAuthButton'

export default function DeAuthButton({setVkData}) {

  return (
    <>
    <div 
    className='deauth-button-container'
    onClick={() => deauth(setVkData)} >
      <div className="deauth-button">
        <img src={EXIT} alt="" className='deauth-button__image' />
        <div className="deauth-button__text-container"><div className='deauth-button__text'>Выйти из профиля</div></div>
        <div class="loader"></div>
      </div>
    </div>
    </>
  )
}