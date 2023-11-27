import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { handlePlanningSwitch } from "../../Handlers/Profile/handlePlanningSwitch";

export default function PlanningSwitch({time_link_id, planning_time_link_id_value}) {
  const dispatch = useDispatch();

  const [autoAttendEnabled, setAutoAttendEnabled] = useState(planning_time_link_id_value);
  
  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div 
          className={autoAttendEnabled ? "switch__body switch__body_true" : "switch__body switch__body_false"}
          onClick={() => {handlePlanningSwitch(dispatch, time_link_id, autoAttendEnabled, setAutoAttendEnabled);
          }}>
          <div className={autoAttendEnabled ? "switch__circle switch__circle_true" : "switch__circle switch__circle_false"}></div>
        </div>
      </div>
    </div>
    </>
  )
}
