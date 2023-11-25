import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToQueue } from "../../FxFetches/Profile/processPlanningQueue";
import { planningDataSETOneFetch, setOnePlanningData } from "../../ReduxStates/Slices/planningDataSlice";
import { handlePlanningSwitch } from "../../Handlers/Profile/handlePlanningSwitch";

export default function PlanningSwitch({time_link_id, planning_time_link_id_value}) {
  const dispatch = useDispatch();

  const [autoAttendEnabled, setAutoAttendEnabled] = useState(planning_time_link_id_value);
  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div 
          className={autoAttendEnabled ? "switch__body-true" : "switch__body-false"}
          onClick={() => {handlePlanningSwitch(dispatch, time_link_id, autoAttendEnabled, setAutoAttendEnabled);
          }}>
          <div className={autoAttendEnabled ? "switch__circle-true" : "switch__circle-false"}></div>
        </div>
      </div>
    </div>
    </>
  )
}
