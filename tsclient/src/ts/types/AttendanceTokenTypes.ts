export interface IResponseSetToken {
  group_changed: boolean | null,
  result_code: string | null,
  new_group_id: number | null,
  new_group_name: string | null,
}

export interface IAttendanceTokenClass {
  attendanceToken: string | null,
  isTokenValid: boolean,
  tooManyRequests: boolean;
  loadingStatus: 'idle' | 'pending' | 'done',
  deleteToken(): void,
}

