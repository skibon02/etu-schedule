import { groupStore, GroupClass } from "../stores/groupStore";
import { dateStore, DateClass } from "../stores/dateStore";
import { IGroupDateService } from "../types/services/GroupDateServiceTypes";
import { runInAction } from "mobx";
import { IGroupSchedule, Igroup } from "../types/stores/GroupTypes";
import { makeSchedule } from "../utils/parseSchedule";
import { makeFetch } from "../utils/makeFetch";
import { weekTime } from "../stores/dateStore";

class GroupDateServiceClass implements IGroupDateService {
  private dateStore: DateClass;
  private groupStore: GroupClass;

  constructor(dateStore: DateClass, groupStore: GroupClass) {

    this.groupIdSetFetch = this.groupIdSetFetch.bind(this);
    this.groupNumberIdGetFetch = this.groupNumberIdGetFetch.bind(this);
    this.groupScheduleGetFetch = this.groupScheduleGetFetch.bind(this);

    this.dateStore = dateStore; 
    this.groupStore = groupStore; 
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
          this.groupStore.scheduleDiffsGETFetch();
          this.groupStore.schedulePlanningGETFetch();
          this.groupStore.groupNumberIdStatus = 'done';
        });
      },
      () => {}
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
            this.groupStore.scheduleDiffsGETFetch();
            this.groupStore.schedulePlanningGETFetch();
          }
          this.groupStore.groupNumberIdStatus = 'done';
        })
      },
      () => {}
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
              this.groupStore.parsedSchedule2 = makeSchedule(d, new Date());
              this.groupStore.parsedSchedule1 = makeSchedule(d, new Date(new Date().getTime() + weekTime));
            }
          } else {
            this.groupStore.parsedSchedule1 = null;
            this.groupStore.parsedSchedule2 = null;
          }
          this.groupStore.groupScheduleStatus = 'done';
        })
      },
      () => {}
    )
  }

  async scheduleDiffsSETFetch(time_link_id: number, weekNumber: number, flag: boolean) {
    makeFetch(
      '/api/attendance/schedule_diffs/update',
      {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: weekNumber,
          enable_auto_attendance: flag,
        }),
        method: "POST",
      },
      () => {},
      () => {}
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
      () => {}
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
      () => {}
    );
  }
}

const groupDateService = new GroupDateServiceClass(dateStore, groupStore);

export {
  groupDateService,
}
