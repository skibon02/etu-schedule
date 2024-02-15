import { runInAction } from "mobx";
import { attendanceTokenStore, AttendanceTokenClass } from "../stores/attendanceTokenStore";
import { groupStore, GroupClass } from "../stores/groupStore";
import { IResponseSetToken } from "../types/stores/AttendanceTokenTypes";
import { IGroupTokenClass } from "../types/services/GroupTokenServiceTypes";
import { makeFetch } from "../utils/makeFetch";

class GroupTokenClass implements IGroupTokenClass {
  private AttendanceTokenStore: AttendanceTokenClass;
  private groupStore: GroupClass;

  constructor(attendanceTokenStore: AttendanceTokenClass, groupStore: GroupClass) {
    this.attendanceTokenSetFetch = this.attendanceTokenSetFetch.bind(this);

    this.AttendanceTokenStore = attendanceTokenStore; 
    this.groupStore = groupStore; 
  }

  async attendanceTokenSetFetch(token: string) {
    const url = '/api/user/set_attendance_token';
    const options = {
      method: "POST",
      body: JSON.stringify({
        attendance_token: token,
      })
    };

    const onSuccess = (url: string, options: Object, onSuccess: Function, onFail: Function, d: IResponseSetToken, retryAccepted: boolean) => {
      if (d.result_code === 'success') {
        runInAction(() => {
          this.AttendanceTokenStore.attendanceToken = token;
          if (d.group_changed === true) {
            this.groupStore.groupId = d.new_group_id;
            this.groupStore.groupNumber = d.new_group_name;
          }
          this.AttendanceTokenStore.loadingStatus = 'done';
        })
      } else if (d.result_code === 'too_many_requests' && retryAccepted) {
        setTimeout(() => {makeFetch(url, options, onSuccess, onFail)}, 5000)
      } else if (d.result_code === 'too_many_requests' && !retryAccepted) {
        runInAction(() => {
          this.AttendanceTokenStore.tooManyRequests = false;
          this.AttendanceTokenStore.loadingStatus = 'done';
        })
      } else {
        runInAction(() => {
          this.AttendanceTokenStore.isTokenValid = false;
          this.AttendanceTokenStore.loadingStatus = 'done';
        })
      }
    }

    this.AttendanceTokenStore.loadingStatus = 'pending';
    makeFetch(
      url,
      options,
      (d: IResponseSetToken) => onSuccess(
        url, 
        options, 
        (d: IResponseSetToken) => onSuccess(url, options, () => {}, () => {}, d, false), 
        () => {}, 
        d, 
        true
      ),
      () => {}
    )
  }
}

const GroupTokenService = new GroupTokenClass(attendanceTokenStore, groupStore);

export {
  GroupTokenService,
}
