import IMAGE1 from '../../../token_description/1.png'
import IMAGE2 from '../../../token_description/2.png'
import IMAGE3 from '../../../token_description/3.png'
import IMAGE4 from '../../../token_description/4.png'
import IMAGE5 from '../../../token_description/5.png'


const images = [
  IMAGE1,
  IMAGE2,
  IMAGE3,
  IMAGE4,
  IMAGE5,
]

const descriptions = [
  'На вашем компьютере откройте сайт "ИС Посещаемость" и нажмите клавишу "f12".',
  'В открывшемся меню выберите вкладу "Network".',
  'Во вкладке "Network" перейдите в раздел "Fetch/XHR" и обновите страницу.',
  'В появившемся списке выберете "check-in".',
  'В разделе "Headers" пролистайте вниз, пока не увидите "Cookie". Скопируйте всё, что идёт после "connect.digital-attendance=".',
]

export { images, descriptions }