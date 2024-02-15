export interface IfullNameEnabled {
  value: 'auto' | 'short',
  label: 'Авто' | 'Сокращённое',
}

export interface IvkData {
  sex: number,
  birthdate: string,
  first_name: string,
  is_authorized: boolean,
  last_name: string,
  profile_photo_url: string,
  user_id: number,
}

export interface IuserDataClass {
  fullNameEnabled: IfullNameEnabled,
  userId: number | null,
  vkData: null | IvkData,
  leaderForGroup: number | null,
  fullNameEnabledAuto(): void,
  fullNameEnabledShort(): void,
  userDataSETFetch(): void,
  vkDataGETFetch(): void,
  reset(): void,
}

