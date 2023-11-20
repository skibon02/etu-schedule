import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToQueue } from "../../FxFetches/Profile/processPlanningQueue";

export default function PlanningSwitch({time_link_id, planning_time_link_id_value}) {
  const dispatch = useDispatch()

  const [autoAttendEnabled, setAutoAttendEnabled] = useState(planning_time_link_id_value);
  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div 
          className={autoAttendEnabled ? "switch__body-true" : "switch__body-false"}
          onClick={() => {
            setAutoAttendEnabled(!autoAttendEnabled)
            addToQueue(dispatch, [time_link_id, !autoAttendEnabled]);
          }}>
          <div className={autoAttendEnabled ? "switch__circle-true" : "switch__circle-false"}></div>
        </div>
      </div>
    </div>
    </>
  )
}
