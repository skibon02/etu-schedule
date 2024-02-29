import { groupStore, GroupClass } from "../stores/groupStore";
import { dateStore, DateClass, weekTime } from "../stores/dateStore";
import { IGroupDateTokenService } from "../types/services/GroupDateTokenServiceTypes";
import { makeAutoObservable, runInAction } from "mobx";
import { IGroupSchedule, Igroup } from "../types/stores/GroupTypes";
import { makeSchedule } from "../utils/Schedule/parseSchedule";
import { makeFetch } from "../utils/makeFetch";
import { IResponseSetToken } from "../types/stores/AttendanceTokenTypes";
import { AttendanceTokenClass, attendanceTokenStore } from "../stores/attendanceTokenStore";

class GroupDateTokenServiceClass implements IGroupDateTokenService {
  private dateStore: DateClass;
  private groupStore: GroupClass;
  private AttendanceTokenStore: AttendanceTokenClass;
  
  constructor(dateStore: DateClass, groupStore: GroupClass, attendanceTokenStore: AttendanceTokenClass) {
    makeAutoObservable(this);

    this.groupIdSetFetch = this.groupIdSetFetch.bind(this);
    this.groupNumberIdGetFetch = this.groupNumberIdGetFetch.bind(this);
    this.groupScheduleGetFetch = this.groupScheduleGetFetch.bind(this);
    this.attendanceTokenSetFetch = this.attendanceTokenSetFetch.bind(this);
    this.userNoteDELETEFetch = this.userNoteDELETEFetch.bind(this);
    this.groupNoteDELETEFetch = this.groupNoteDELETEFetch.bind(this);
    this.userNoteSETFetch = this.userNoteSETFetch.bind(this);
    this.groupNoteSETFetch = this.groupNoteSETFetch.bind(this);

    this.dateStore = dateStore; 
    this.groupStore = groupStore; 
    this.AttendanceTokenStore = attendanceTokenStore;
  }

  async groupIdSetFetch(groupId: number, groupNumber: string) {
    this.groupStore.groupNumberIdStatus = 'pending';
    makeFetch(
      '/api/user/set_group',
      {
        body: JSON.stringify({group_id: groupId}),
        method: "POST",
      },
      () => {
        console.log('group id is:', groupId);
        runInAction(() => {
          this.groupStore.groupId = groupId;
          this.groupStore.groupNumber = groupNumber;
          this.groupScheduleGetFetch(groupId);
          this.groupStore.schedulePlanningGETFetch();
          this.groupStore.scheduleDiffsGETFetch();
          this.groupStore.userNotesGETFetch();
          this.groupStore.groupNotesGETFetch();
          this.groupStore.groupNumberIdStatus = 'done';
        });
      },
      () => {},
      'установить группу'
    )
  }

  async groupNumberIdGetFetch() {
    this.groupStore.groupNumberIdStatus = 'pending';
    makeFetch(
      '/api/user/get_group',
      {},
      (d: {current_group: null | Igroup}) => {
        runInAction(() => {
          if (d.current_group !== null) {
            this.groupStore.groupId = d.current_group.group_id;
            this.groupStore.groupNumber = d.current_group.number;
            this.groupScheduleGetFetch(d.current_group.group_id);
            this.groupStore.schedulePlanningGETFetch();
            this.groupStore.scheduleDiffsGETFetch();
            this.groupStore.userNotesGETFetch();
            this.groupStore.groupNotesGETFetch();
          }
          this.groupStore.groupNumberIdStatus = 'done';
        })
      },
      () => {},
      'загрузить данные о группе'
    )
  }

  async groupScheduleGetFetch(groupId: number) {
    this.groupStore.groupScheduleStatus = 'pending';
    makeFetch(
      `/api/scheduleObjs/group/${groupId}`,
      {},
      (d: IGroupSchedule) => {
        runInAction(() => {
          this.groupStore.groupSchedule = d;
          if (d.is_ready) {
            if (this.dateStore.absoluteWeekParity === '1') {
              this.groupStore.parsedSchedule1 = makeSchedule(d, new Date());
              this.groupStore.parsedSchedule2 = makeSchedule(d, new Date(new Date().getTime() + weekTime));
            } else {
              this.groupStore.parsedSchedule1 = makeSchedule(d, new Date(new Date().getTime() + weekTime));
              this.groupStore.parsedSchedule2 = makeSchedule(d, new Date());
            }
          } else {
            this.groupStore.parsedSchedule1 = null;
            this.groupStore.parsedSchedule2 = null;
          }
          this.groupStore.groupScheduleStatus = 'done';
        })
      },
      () => {},
      'загрузить расписание группы'
    )
  }

  async scheduleDiffsSETFetch(time_link_id: number, flag: boolean) {
    makeFetch(
      '/api/attendance/schedule_diffs/update',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: this.dateStore.weekNumber,
          enable_auto_attendance: flag,
        }),
        method: "POST",
      },
      () => {},
      () => {},
      'отправить данные о посещаемости'
    )
  }

  async schedulePlanningSETOneFetch(time_link_id: number, flag: boolean) {
    if (this.groupStore.schedulePlanning !== null && this.groupStore.schedulePlanning[time_link_id] !== undefined) {
      this.groupStore.schedulePlanning[time_link_id].auto_attendance_enabled = flag;
    }

    makeFetch(
      '/api/attendance/schedule/update',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id, 
          enable_auto_attendance: flag
        }),
        method: "POST",
      }, 
      () => {this.groupStore.scheduleDiffsGETFetch()}, 
      () => {},
      'отправить данные о посещаемости'
    );
  }

  async schedulePlanningSETAllFetch(flag: boolean) {
    if (this.groupStore.schedulePlanning !== null) {
      Object.keys(this.groupStore.schedulePlanning!).forEach(key => {
        if (this.groupStore.schedulePlanning![Number(key)] !== undefined) {
          this.groupStore.schedulePlanning![Number(key)].auto_attendance_enabled = flag;
        }
      });
    }

    makeFetch(
      '/api/attendance/schedule/update_all',
      {
        body: JSON.stringify({
          enable_auto_attendance: flag
        }),
        method: "POST",
      },
      () => {this.groupStore.scheduleDiffsGETFetch()},
      () => {},
      'отправить данные о посещаемости'
    );
  }

  async attendanceTokenSetFetch(token: string) {
    if (!token) {
      return;
    }
    
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
            this.groupScheduleGetFetch(d.new_group_id!);
            this.groupStore.schedulePlanningGETFetch();
            this.groupStore.scheduleDiffsGETFetch();
            this.groupStore.userNotesGETFetch();
            this.groupStore.groupNotesGETFetch();
          }
          this.AttendanceTokenStore.loadingStatus = 'done';
        })
      } else if (d.result_code === 'too_many_requests' && retryAccepted) {
        setTimeout(() => {makeFetch(url, options, onSuccess, onFail, 'установить токен')}, 5000);
      } else if (d.result_code === 'too_many_requests' && !retryAccepted) {
        runInAction(() => {
          this.AttendanceTokenStore.tooManyRequests = true;
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
      () => {},
      'установить токен'
    )
  }

  async userNoteDELETEFetch(time_link_id: number) {
    runInAction(() => {
      this.groupStore.userNotesStatus = 'pending';
    })
    await makeFetch(
      '/api/notes/user',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: this.dateStore.weekNumber,
        }),
        method: "DELETE",
      },
      () => {
        runInAction(() => {
          this.groupStore.userNotesStatus = 'done';
        })
      },
      () => {},
      'удалить заметку'
    )
  }

  async groupNoteDELETEFetch(time_link_id: number) {
    runInAction(() => {
      this.groupStore.groupNotesStatus = 'pending';
    })
    await makeFetch(
      '/api/notes/group',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: this.dateStore.weekNumber,
        }),
        method: "DELETE",
      },
      () => {
        runInAction(() => {
          this.groupStore.groupNotesStatus = 'done';
        })
      },
      () => {},
      'удалить заметку'
    )
  }

  async userNoteSETFetch(time_link_id: number, text: string) {
    runInAction(() => {
      this.groupStore.userNotesStatus = 'pending';
    })
    await makeFetch(
      '/api/notes/user/create_update',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: this.dateStore.weekNumber,
          text: text,
        }),
        method: "POST",
      },
      () => {
        runInAction(() => {
          this.groupStore.userNotesStatus = 'done';
          if (this.groupStore.userNotes !== null) {
            this.groupStore.userNotes.weeks[this.dateStore.weekNumber].user_notes[time_link_id] = text;
          } else {
            this.groupStore.userNotesGETFetch();
          }
        })
      },
      () => {},
      'сохранить заметку пользователя'
    )
  }

  async groupNoteSETFetch(time_link_id: number, text: string) {
    runInAction(() => {
      this.groupStore.groupNotesStatus = 'pending';
    })
    await makeFetch(
      '/api/notes/group/create_update',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: this.dateStore.weekNumber,
          text: text,
        }),
        method: "POST",
      },
      () => {
        runInAction(() => {
          this.groupStore.groupNotesStatus = 'done';
          if (this.groupStore.groupNotes !== null) {
            this.groupStore.groupNotes.weeks[this.dateStore.weekNumber].group_notes[time_link_id] = text;
          } else {
            this.groupStore.groupNotesGETFetch();
          }
        })
      },
      () => {},
      'сохранить заметку группы'
    )
  }
}

const GroupDateTokenService = new GroupDateTokenServiceClass(dateStore, groupStore, attendanceTokenStore);

export {
  GroupDateTokenService,
}
