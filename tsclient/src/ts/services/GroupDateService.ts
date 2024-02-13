import myfetch from "../utils/myfetch";
import { groupStore, GroupClass } from "../stores/groupStore";
import { dateStore, DateClass } from "../stores/dateStore";
import { IGroupDateService } from "../types/GroupDateServiceTypes";
import { runInAction } from "mobx";
import { IGroupSchedule } from "../types/GroupTypes";
import { makeSchedule } from "../utils/parseSchedule";

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
    try {
      const r = await myfetch('/api/user/set_group', {
        body: JSON.stringify({group_id: groupId}),
        method: "POST",
        credentials: "include",
      });
      if (r.status === 200) {
        const d = await r.json();
        console.log('Successfully fetched on set groupId:', d);
        console.log('id is:', groupId);
        runInAction(() => {
          this.groupStore.groupId = groupId;
          this.groupStore.groupNumber = groupNumber;
          this.groupScheduleGetFetch(groupId);
          this.groupStore.groupNumberIdStatus = 'done';
        });
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in groupId set fetch:', e.message);
    }
  }

  async groupNumberIdGetFetch() {
    this.groupStore.groupNumberIdStatus = 'pending';
    try {
      const r = await myfetch('/api/user/get_group');
    
      if (r.status === 200) {
        const d = await r.json();
        console.log('successful fetch on get group id:', d);

        runInAction(() => {
          if (d.current_group !== null) {
            this.groupStore.groupId = d.current_group.group_id;
            this.groupStore.groupNumber = d.current_group.number;
            this.groupScheduleGetFetch(this.groupStore.groupId!);
          }
          this.groupStore.groupNumberIdStatus = 'done';
        })
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in groupNumberId get fetch:', e.message);
    }
  }

  async groupScheduleGetFetch(groupId: number) {
    this.groupStore.groupScheduleStatus = 'pending';
    try {
      const r = await myfetch(`/api/scheduleObjs/group/${groupId}`);

      if (r.status === 200) {
        const d: IGroupSchedule = await r.json();
        console.log('successful fetch on groupSchedule:', d);
        runInAction(() => {
          if (d.is_ready) {
            this.groupStore.groupSchedule = d;
            if (this.dateStore.absoluteWeekParity === '1') {
              this.groupStore.parsedSchedule1 = makeSchedule(d, new Date());
              this.groupStore.parsedSchedule2 = makeSchedule(d, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
            } else {
              this.groupStore.parsedSchedule2 = makeSchedule(d, new Date());
              this.groupStore.parsedSchedule1 = makeSchedule(d, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
            }
          } else {
            this.groupStore.groupSchedule = null;
            this.groupStore.parsedSchedule1 = null;
            this.groupStore.parsedSchedule2 = null;
          }
          this.groupStore.groupScheduleStatus = 'done';
        })
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in groupSchedule get fetch:', e.message);
    }
  }

  async scheduleDiffsSETFetch(time_link_id: number, weekNumber: number, flag: boolean) {
    try {
      const r = await myfetch('/api/attendance/schedule_diffs/update', {
        body: JSON.stringify({
          schedule_obj_time_link_id: time_link_id,
          week_num: +weekNumber,
          enable_auto_attendance: flag,
        }),
        credentials: "include",
        method: "POST",
      });
    
      if (r.status === 200) {
        const d = await r.json();
        console.log('successful fetch on set schedule diffs:', d);
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in set schedule diffs fetch:', e.message);
    }
  }

  async schedulePlanningSETOneFetch(time_link_id: number, flag: boolean) {
    try {
      const r = await myfetch(`/api/attendance/schedule/update`, {
        body: JSON.stringify({
          schedule_obj_time_link_id: +time_link_id, 
          enable_auto_attendance: flag
        }),
        method: "POST",
        credentials: "include",
      });
    
      if (r.status === 200) {
        const d = await r.json();
        console.log('successful fetch on set one schedule planning:', d);
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in set one schedule planning fetch:', e.message);
    }
  }

  async schedulePlanningSETAllFetch(flag: boolean) {
    try {
      const r = await myfetch('/api/attendance/schedule/update_all', {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          enable_auto_attendance: flag
        })
      });
    
      if (r.status === 200) {
        const d = await r.json();
        console.log('successful fetch on set all schedule planning:', d);
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in set all schedule planning fetch:', e.message);
    }
  }
}

const groupDateService = new GroupDateServiceClass(dateStore, groupStore);

export {
  groupDateService,
}
