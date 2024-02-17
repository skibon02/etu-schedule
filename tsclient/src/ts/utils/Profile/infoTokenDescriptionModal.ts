import IMAGE1 from '../../../token_description/defaults/1.png'
import IMAGE2 from '../../../token_description/defaults/2.png'
import IMAGE3 from '../../../token_description/defaults/3.png'
import IMAGE4 from '../../../token_description/defaults/4.png'
import IMAGE5 from '../../../token_description/defaults/5.png'
import IMAGE6 from '../../../token_description/defaults/6.png'

import MINI1 from '../../../token_description/minies/1-mini.png'
import MINI2 from '../../../token_description/minies/2-mini.png'
import MINI3 from '../../../token_description/minies/3-mini.png'
import MINI4 from '../../../token_description/minies/4-mini.png'
import MINI5 from '../../../token_description/minies/5-mini.png'
import MINI6 from '../../../token_description/minies/6-mini.png'

import ORIGIN1 from '../../../token_description/origins/1.png'
import ORIGIN2 from '../../../token_description/origins/2.png'
import ORIGIN3 from '../../../token_description/origins/3.png'
import ORIGIN4 from '../../../token_description/origins/4.png'
import ORIGIN5 from '../../../token_description/origins/5.png'
import ORIGIN6 from '../../../token_description/origins/6.png'


const images = [
  IMAGE1,
  IMAGE2,
  IMAGE3,
  IMAGE4,
  IMAGE5,
  IMAGE6,
]

const minies = [
  MINI1,
  MINI2,
  MINI3,
  MINI4,
  MINI5,
  MINI6,
]

const origins = [
  ORIGIN1,
  ORIGIN2,
  ORIGIN3,
  ORIGIN4,
  ORIGIN5,
  ORIGIN6,
]

const descriptions = [
  'На вашем компьютере откройте сайт "ИС Посещаемость" и нажмите клавишу "f12".',
  'В открывшемся меню выберите вкладу "Network".',
  'Во вкладке "Network" перейдите в раздел "Fetch/XHR" и обновите страницу.',
  'В появившемся списке выберете "check-in".',
  'В разделе "Headers" пролистайте вниз, пока не увидите "Cookie". Скопируйте всё, что идёт после "connect.digital-attendance=".',
  'Также важно понимать, что токен действителен только 6 дней с момента авторзации в "ИС Посещаемость", после чего вам необходимо заново авторизоваться, чтобы получить новый токен.'
]

export { images, descriptions, origins, minies }