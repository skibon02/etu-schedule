import {deauth} from '../../FxFetches/Profile/DeAuthButton'
import { useDispatch } from 'react-redux'

export default function AreYouSure({areYouSure, setAreYouSure}) {
  const dispatch = useDispatch();

  return (
    <>
    <div className="are-you-sure">
      <div className="are-you-sure__body">
        <div className="are-you-sure__text">
          Вы уверены, что хотите выйти?
        </div>
        <div className="are-you-sure__buttons">
          <div className="are-you-sure__button are-you-sure__button_confirm"
               onClick={() => deauth(dispatch)}>
            Да
          </div>
          <div className="are-you-sure__button are-you-sure__button_cancel"
               onClick={() => setAreYouSure(!areYouSure)}>
            Отмена
          </div>
        </div>
      </div>
    </div>
    </>
  )
}