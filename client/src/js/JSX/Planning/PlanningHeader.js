import { PlanningButton } from "./PlanningButton";

export default function PlanningHeader({weekParity, setWeekParity, setInCSST}) {

  function handle2() {
    setInCSST(false);
    setWeekParity('2');
    setTimeout(() => {
      setInCSST(true);
    }, 100);
  }

  function handle1() {
    setInCSST(false);
    setWeekParity('1');
    setTimeout(() => {
      setInCSST(true);
    }, 100);
  }

  return (
    <>
    <div className='planning-header'>
      <PlanningButton
        parity={'1'}
        selectedParity={weekParity}
        text={'Первая неделя'}
        handleClick={handle1} />
      <PlanningButton
        parity={'2'}
        selectedParity={weekParity}
        text={'Вторая неделя'}
        handleClick={handle2} />
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