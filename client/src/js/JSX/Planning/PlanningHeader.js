import { PlanningButton } from "./PlanningButton";

export default function PlanningHeader({weekParity, setWeekParity}) {

  return (
    <>
    <div className='planning-header'>
      <PlanningButton
        parity={'1'}
        selectedParity={weekParity}
        text={'Первая неделя'}
        handleClick={() => setWeekParity('1')} />
      <PlanningButton
        parity={'2'}
        selectedParity={weekParity}
        text={'Вторая неделя'}
        handleClick={() => setWeekParity('2')} />
    </div>
    <div className="planning-thead">
      <div className="planning-thead__body">
        <div className="planning-thead__lesson">
          Предмет
        </div>
        <div className="planning-thead__attendance">
          Авто-посещение
        </div>
      </div>
    </div>
    <div className="under-planning-thead-box"></div>
    </>
  )
}