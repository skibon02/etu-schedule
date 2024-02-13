import { runInAction } from "mobx";
import { UserDataClass, userDataStore } from "../stores/userDataStore";
import { GroupClass, groupStore } from "../stores/groupStore";
import { AttendanceTokenClass, attendanceTokenStore } from "../stores/attendanceTokenStore";
import myfetch from "../utils/myfetch";
import { Igroup } from "../types/GroupTypes";
import { IUserDataGroupTokenService, IuserDataGetFetchResponse } from "../types/UserDataGroupTokenTypes";

class UserDataGroupTokenClass implements IUserDataGroupTokenService {
  private groupStore: GroupClass;
  private userDataStore: UserDataClass;
  private attendanceTokenStore: AttendanceTokenClass;

  constructor(
    attendanceTokenStore: AttendanceTokenClass, 
    groupStore: GroupClass,
    userDataStore: UserDataClass
  ) {
    this.userDataGetFetch = this.userDataGetFetch.bind(this);
    
    this.groupStore = groupStore;
    this.userDataStore = userDataStore;
    this.attendanceTokenStore = attendanceTokenStore;
  }

  async userDataGetFetch() {
    try {
      const r = await myfetch('/api/user/get_data');
      if (r.status === 200) {
        const d: IuserDataGetFetchResponse = await r.json();
        console.log('successfully fetched on user/get_data:', d);

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
              value: 'short',
              label: 'Сокращённое',
            };
          }
          this.userDataStore.leaderForGroup = d.leader_for_group;
  
          // attendanceToken
          this.attendanceTokenStore.attendanceToken = d.attendance_token;
        })
      } else {
        throw new Error(`${r.status}`)
      }
    } catch (error) {
      const e = error as Error;
      console.error('Failed to fetch user/get_data:', e.message);
    }
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
