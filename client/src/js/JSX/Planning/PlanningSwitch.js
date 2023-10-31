import { useState } from "react";
import { CSSTransition } from "react-transition-group";

export default function PlanningSwitch() {
  const [autoAttendEnabled, setAutoAttendEnabled] = useState(true);

  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div className={autoAttendEnabled ? "switch__body-true switch__body-false" : "switch__body-false"}
        onClick={() => setAutoAttendEnabled(!autoAttendEnabled)}>
          <div className={autoAttendEnabled ? "switch__circle-true switch__circle-false" : "switch__circle-false"}></div>
        </div>
      </div>
    </div>
    </>
  )

}