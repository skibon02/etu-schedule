import { CSSTransition } from "react-transition-group";
import { makeWeek } from "../../Utils/Schedule/Week/makeWeek";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export default function Week({weekSchedule}) {

  const weekNumber = useSelector(s => s.date.weekNumber);
  const [inCSST, setInCSST] = useState(true);

  useEffect(() => {
    setInCSST(false)
    let interval = setTimeout(() => {
      setInCSST(true);
    }, 0);

    return () => clearInterval(interval)
  }, [weekNumber]);

  const week = makeWeek(weekSchedule);

  return (
    <CSSTransition in={inCSST} timeout={500} classNames={'week-transition'} unmountOnExit>
      <div className="schedule week-transition">
        {week}
      </div>
    </CSSTransition>
    )
}