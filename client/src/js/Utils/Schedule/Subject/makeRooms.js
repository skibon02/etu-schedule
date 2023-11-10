import GPSLIGHT from '../../../../icons/gpslite.svg'
import GPS from '../../../../icons/location-pin-svgrepo-com.svg'

export function makeRooms(roomN, isDead, active) {
  if (!roomN) {
    return;
  }
  roomN = roomN.replace(/,/g, '').split(' ');
  let rooms = [];
  for (let i = 0; i < roomN.length; i++) {
    rooms.push(
        <div key={roomN[i]} className='lesson-type-room__room'>
          <img 
            draggable={false} 
            className='lesson-type-room__image' 
            src={active === 'schedule' && isDead ? GPSLIGHT : GPS} 
            alt="gps" /> 
            <div className='lesson-type-room__text'>
              {roomN[i]}
            </div>
        </div>
    )
  }

  return (
    <div className='lesson-type-room__rooms'>
      {rooms}
    </div>
  )
}