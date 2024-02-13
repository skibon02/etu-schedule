import { runInAction } from "mobx";
import myfetch from "../utils/myfetch";
import { attendanceTokenStore, AttendanceTokenClass } from "../stores/attendanceTokenStore";
import { groupStore, GroupClass } from "../stores/groupStore";
import { IResponseSetToken } from "../types/AttendanceTokenTypes";
import { IGroupTokenClass } from "../types/GroupTokenServiceTypes";

class GroupTokenClass implements IGroupTokenClass {
  private AttendanceTokenStore: AttendanceTokenClass;
  private groupStore: GroupClass;

  constructor(attendanceTokenStore: AttendanceTokenClass, groupStore: GroupClass) {
    this.attendanceTokenSetFetch = this.attendanceTokenSetFetch.bind(this);

    this.AttendanceTokenStore = attendanceTokenStore; 
    this.groupStore = groupStore; 
  }

  async attendanceTokenSetFetch(token: string) {
    try {
      const r = await myfetch('/api/user/set_attendance_token', {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          attendance_token: token,
        })
      });
      if (r.status === 200) {
        const d: IResponseSetToken = await r.json();
        console.log('Successfully fetched on set attendance token with token:', token);
        console.log('Response:', d);
        runInAction(() => {
          if (d.result_code === 'success') {
            this.AttendanceTokenStore.attendanceToken = token;
            if (d.group_changed === true) {
              // this.GroupStore.groupId = 
            }
          } else {
            this.AttendanceTokenStore.isTokenValid = false;
          }
        })
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error fetching set attendance token:', e.message);
    }
  }
}

const GroupTokenService = new GroupTokenClass(attendanceTokenStore, groupStore);

export {
  GroupTokenService,
}
