import { CSSTransition } from "react-transition-group";
import { makeWeek } from "../../Utils/Schedule/Week/makeWeek";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export default function Week({weekSchedule}) {

  const weekNumber = useSelector(s => s.date.weekNumber);
  const [inCSST, setInCSST] = useState(false);
  const [week, setWeek] = useState(makeWeek(weekSchedule));

  useEffect(() => {
    setInCSST(false);
    setTimeout(() => {
      setInCSST(true);
      setWeek(makeWeek(weekSchedule))
    }, 100);
  }, [weekNumber, weekSchedule]);

  return (
    <CSSTransition in={inCSST} timeout={100} classNames={'week-transition'} unmountOnExit>
      <div className="schedule week-transition">
        {week}
      </div>
    </CSSTransition>
    )
}