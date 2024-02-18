import { IUsableSchedule } from "../../stores/GroupTypes";

export interface ISubjectProps {
  subjectData: IUsableSchedule,
  orderNumber: number,
  planning_time_link_id_value: boolean,
  schedule_diffs_value: null | boolean
}

