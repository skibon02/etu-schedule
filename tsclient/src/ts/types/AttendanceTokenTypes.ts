export interface IResponseSetToken {
  group_changed: boolean | null,
  result_code: string | null,
}

export interface IAttendanceTokenClass {
  attendanceToken: string | null,
  groupChanged: boolean,
  isTokenValid: boolean,
  loadingStatus: 'idle' | 'pending' | 'done',
  deleteToken(): void,
}

