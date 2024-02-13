export interface IfullNameEnabled {
  value: 'auto' | 'short',
  label: 'Авто' | 'Сокращённое',
}

export interface IuserData {
  fullNameEnabled: IfullNameEnabled,
  userId: number | null,
  leaderForGroup: number | null,
  fullNameEnabledAuto(): void,
  fullNameEnabledShort(): void,
  userDataSETFetch(): void,
}

