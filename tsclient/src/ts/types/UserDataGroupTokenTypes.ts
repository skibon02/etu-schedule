import { Igroup } from "./GroupTypes";

export interface IUserDataGroupTokenService {
  userDataGetFetch(): void,
}

export interface IuserDataGetFetchResponse {
  user_id: number,
  group: Igroup | null,
  subjects_title_formatting: string,
  last_known_schedule_generation: null | number,
  attendance_token: null | string,
  leader_for_group: null | number,
}

