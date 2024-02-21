export interface IGroupDateTokenService {
  groupIdSetFetch(groupId: number, groupNumber: string): void,
  groupNumberIdGetFetch(): void,
  groupScheduleGetFetch(groupId: number): void,
  scheduleDiffsSETFetch(time_link_id: number, flag: boolean): void,
  schedulePlanningSETOneFetch(time_link_id: number, flag: boolean): void,
  schedulePlanningSETAllFetch(flag: boolean): void,
  attendanceTokenSetFetch(token: string): void;
  userNoteDELETEFetch(time_link_id: number): void;
  groupNoteDELETEFetch(time_link_id: number): void;
  userNoteSETFetch(time_link_id: number, text: string): Promise<void>;
  groupNoteSETFetch(time_link_id: number, text: string): Promise<void>;
}

export interface CreateUserNoteResultSuccess {
  action: string; // "created" или "updated"
}

