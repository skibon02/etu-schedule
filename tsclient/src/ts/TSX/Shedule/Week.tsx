import { CSSTransition } from "react-transition-group";
import { useEffect, useState } from "react";
import { dateStore } from "../../stores/dateStore";
import { IScheduleObjectExtended } from "../../types/stores/GroupTypes";
import { makeWeek } from "../../utils/Schedule/makeWeek";
import { observer } from "mobx-react";

function Week({weekSchedule}: {weekSchedule: Array<IScheduleObjectExtended[] | [null, string]>}) {

  const [inCSST, setInCSST] = useState(false);
  const [week, setWeek] = useState(makeWeek(weekSchedule));

  useEffect(() => {
    setInCSST(false);
    setTimeout(() => {
      setInCSST(true);
      setWeek(makeWeek(weekSchedule))
    }, 100);
  }, [dateStore.weekNumber, weekSchedule]);

  return (
    <CSSTransition in={inCSST} timeout={100} classNames={'week-transition'} unmountOnExit>
      <div className="schedule week-transition">
        {week}
      </div>
    </CSSTransition>
  )
}

export default observer(Week);
