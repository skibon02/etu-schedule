import { makeAutoObservable, runInAction } from "mobx";
import { UserDataClass, userDataStore } from "../stores/userDataStore";
import { GroupClass, groupStore } from "../stores/groupStore";
import { AttendanceTokenClass, attendanceTokenStore } from "../stores/attendanceTokenStore";
import { Igroup } from "../types/stores/GroupTypes";
import { IUserDataGroupTokenService, IuserDataGetFetchResponse } from "../types/services/UserDataGroupTokenTypes";
import { makeFetch } from "../utils/makeFetch";

class UserDataGroupTokenClass implements IUserDataGroupTokenService {
  private groupStore: GroupClass;
  private userDataStore: UserDataClass;
  private attendanceTokenStore: AttendanceTokenClass;

  constructor(
    attendanceTokenStore: AttendanceTokenClass, 
    groupStore: GroupClass,
    userDataStore: UserDataClass
  ) {
    makeAutoObservable(this);

    this.userDataGetFetch = this.userDataGetFetch.bind(this);
    
    this.groupStore = groupStore;
    this.userDataStore = userDataStore;
    this.attendanceTokenStore = attendanceTokenStore;
  }

  async userDataGetFetch() {
    makeFetch(
      '/api/user/get_data',
      {},
      (d: IuserDataGetFetchResponse) => {
        runInAction(() => {
          // group
          const group: Igroup | null = d.group;
          if (group !== null) {
            this.groupStore.groupId = group.group_id;
            this.groupStore.groupNumber = group.number;
          }
  
          // userData 
          this.userDataStore.userId = d.user_id;
          if (d.subjects_title_formatting === 'auto') {
            this.userDataStore.fullNameEnabled = {
              value: 'auto',
              label: 'Авто'
            };
          } else {
            this.userDataStore.fullNameEnabled = {
              value: 'shorten',
              label: 'Сокращённое',
            };
          }
          this.userDataStore.leaderForGroup = d.leader_for_group;
  
          // attendanceToken
          this.attendanceTokenStore.attendanceToken = d.attendance_token;
        })
      },
      () => {},
      'получить данные о профиле',
    )
  }
}

const UserDataGroupTokenService = new UserDataGroupTokenClass(
  attendanceTokenStore,
  groupStore,
  userDataStore
);

export {
  UserDataGroupTokenService,
}
