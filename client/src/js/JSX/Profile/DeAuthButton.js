import { useDispatch } from 'react-redux'
import EXIT from '../../../icons/exit.svg'
import {deauth} from '../../FxFetches/Profile/DeAuthButton'

export default function DeAuthButton({setGroupNumber, setGroupId, setGroupSchedule}) {
  const dispatch = useDispatch();

  return (
    <>
    <div 
      className='deauth-button-container'
      onClick={() => deauth(dispatch, setGroupNumber, setGroupId, setGroupSchedule)} >
      <div className="deauth-button">
        <img src={EXIT} alt="" className='deauth-button__image' />
        <div className="deauth-button__text-container"><div className='deauth-button__text'>Выйти из профиля</div></div>
        <div className="loader"></div>
      </div>
    </div>
    </>
  )
}