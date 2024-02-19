export interface IGroupDateTokenService {
  groupIdSetFetch(groupId: number, groupNumber: string): void,
  groupNumberIdGetFetch(): void,
  groupScheduleGetFetch(groupId: number): void,
  scheduleDiffsSETFetch(time_link_id: number, flag: boolean): void,
  schedulePlanningSETOneFetch(time_link_id: number, flag: boolean): void,
  schedulePlanningSETAllFetch(flag: boolean): void,
  attendanceTokenSetFetch(token: string): void;
}