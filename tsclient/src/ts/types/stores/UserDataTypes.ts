export interface IfullNameEnabled {
  value: 'auto' | 'shorten',
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
  activeSubjectId: number;
  setActiveSubjectId: (subjectId: number) => void;
  fullNameEnabledAuto(): void,
  fullNameEnabledShort(): void,
  userDataSETFetch(): void,
  vkDataGETFetch(): void,
  reset(): void,
}


