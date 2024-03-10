import { GroupDateTokenService } from "../../services/GroupDateTokenService";
import { IplanningSwitchProps } from "../../types/tsx/Planning/PlanningSwitchType";

export default function PlanningSwitch({time_link_id, planning_time_link_id_value}: IplanningSwitchProps) {

  return (
    <>
    <div className="auto-planning">
      <div className="switch">
        <div 
          className={!planning_time_link_id_value ? "switch__body switch__body_false" : "switch__body"}
          role="button" onClick={() => GroupDateTokenService.schedulePlanningSETOneFetch(time_link_id, !planning_time_link_id_value)}>
          <div className="switch__circle"></div>
        </div>
      </div>
    </div>
    </>
  )
}
