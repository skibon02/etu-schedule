import { useState, useEffect } from "react";
import { WeekHeader } from "../Schedule/WeekHeader";
import { isEvenWeek } from "../../Utils/handleTime";
import { useDispatch, useSelector } from "react-redux";
import NoSchedule from "../Schedule/NoSchedule";
import PlanningHeader from "./PlanningHeader";
import Week from "../Schedule/Week";
import { CSSTransition } from "react-transition-group";
import { useInCSSTransition } from "../../Utils/Hooks/useInCSSTransition";

export default function Planning() {

  const { groupNumber } = useSelector(s => s.groupNI);
  const { groupSchedule, parsedSchedule1, parsedSchedule2 } = useSelector(s => s.groupSchedule);
  const { planningData } = useSelector(s => s.planningData);
  const { active } = useSelector(s => s.active);

  const [weekParity, setWeekParity] = useState(isEvenWeek(new Date));
  const inCSST = useInCSSTransition(weekParity)

  if (!groupSchedule) {
    return (
      <NoSchedule groupNumber={groupNumber} />
    );
  }
  
  if (!groupSchedule.is_ready) {
    return (
      <NoSchedule groupNumber={-1} />
    );
  }

  if (planningData) {
    return (
      <CSSTransition in={active === 'planning'} timeout={300} classNames={'modal-transition'} unmountOnExit>
      <div className="modal-transition">
        <PlanningHeader weekParity={weekParity} setWeekParity={setWeekParity} />
  
        <CSSTransition in={inCSST} timeout={500} classNames={'week-transition'} unmountOnExit key={weekParity}>
          <div className="week-transition">
            <WeekHeader weekParity={weekParity} />
            <Week weekSchedule={weekParity === '1' ? parsedSchedule1 : parsedSchedule2} />
          </div>
        </CSSTransition>
  
        <div className="under-planning-thead-box-mobile"></div>
      </div>
      </CSSTransition>
    );
  }
}