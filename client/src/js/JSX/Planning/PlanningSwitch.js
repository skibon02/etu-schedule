import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CSSTransition } from 'react-transition-group';
import { handlePlanningSwitch } from "../../Handlers/Profile/handlePlanningSwitch";

export default function PlanningSwitch({time_link_id, planning_time_link_id_value}) {
  const dispatch = useDispatch();

  const [autoAttendEnabled, setAutoAttendEnabled] = useState(planning_time_link_id_value);

  useEffect(() => {
    setAutoAttendEnabled(planning_time_link_id_value)
  }, [planning_time_link_id_value]);
  
  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div 
          className={!autoAttendEnabled ? "switch__body switch__body_false" : "switch__body"}
          onClick={() => {
            handlePlanningSwitch(dispatch, time_link_id, autoAttendEnabled);
            setAutoAttendEnabled(!autoAttendEnabled)
          }}>
          <div className="switch__circle"></div>
        </div>
      </div>
    </div>
    </>
  )
}
