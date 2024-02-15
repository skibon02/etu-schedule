import { makeAutoObservable, runInAction } from "mobx";
import { IGroupClass, IGroupSchedule, Igroup, IscheduleDiff, IscheduleDiffs, parsedSchedule } from "../types/stores/GroupTypes";
import { makeFetch } from "../utils/makeFetch";

export class GroupClass implements IGroupClass {
  groupNumber: null | string;
  groupId: null | number;
  groupNumberIdStatus: 'idle' | 'pending' | 'done';
  groupSchedule: IGroupSchedule | null;
  parsedSchedule1: parsedSchedule | null;
  parsedSchedule2: parsedSchedule | null;
  groupScheduleStatus:  'idle' | 'pending' | 'done';
  schedulePlanning: IscheduleDiff | null;
  schedulePlanningStatus:  'idle' | 'pending' | 'done';
  scheduleDiffs: IscheduleDiffs | null;
  scheduleDiffsStatus:  'idle' | 'pending' | 'done';
  groupList: Igroup[] | null;
  groupListStatus:  'idle' | 'pending' | 'done';

  constructor() {
    makeAutoObservable(this);

    this.scheduleDiffsGETFetch = this.scheduleDiffsGETFetch.bind(this);
    this.schedulePlanningGETFetch = this.schedulePlanningGETFetch.bind(this);
    this.groupListGETFetch = this.groupListGETFetch.bind(this);
    this.reset = this.reset.bind(this);

    this.groupNumber = null;
    this.groupId = null;
    this.groupNumberIdStatus = 'idle';
    this.groupSchedule = null;
    this.parsedSchedule1 = null;
    this.parsedSchedule2 = null;
    this.groupScheduleStatus = 'idle';
    this.schedulePlanning = null;
    this.schedulePlanningStatus = 'idle';
    this.scheduleDiffs = null;
    this.scheduleDiffsStatus = 'idle';
    this.groupList = null;
    this.groupListStatus = 'idle';
  }

  async scheduleDiffsGETFetch() {
    this.scheduleDiffsStatus = 'pending';
    makeFetch(
      '/api/attendance/schedule_diffs',
      {},
      (d: IscheduleDiffs) => {
        runInAction(() => {
          this.scheduleDiffs = d;
          this.scheduleDiffsStatus = 'done';
        })
      },
      () => {}
    )
  }

  async schedulePlanningGETFetch() {
    this.schedulePlanningStatus = 'pending';
    makeFetch(
      '/api/attendance/schedule',
      {},
      (d: IscheduleDiff) => {
        runInAction(() => {
          this.schedulePlanning = d;
          this.schedulePlanningStatus = 'done';
        })
      },
      () => {}
    )
  }

  async groupListGETFetch() {
    this.groupListStatus = 'pending';
    makeFetch(
      '/api/groups',
      {},
      (d: Igroup[]) => {
        const groups: Igroup[] = [];
        Object.values(d).forEach((group: Igroup) => {
          groups.push(group)
        });
        runInAction(() => {
          this.groupList = groups;
          this.groupListStatus = 'done';
        })
      },
      () => {}
    )
  }

  reset() {
    runInAction(() => {
      this.groupNumber = null;
      this.groupId = null;
      this.groupNumberIdStatus = 'idle';
      this.groupSchedule = null;
      this.parsedSchedule1 = null;
      this.parsedSchedule2 = null;
      this.groupScheduleStatus = 'idle';
      this.schedulePlanning = null;
      this.schedulePlanningStatus = 'idle';
      this.scheduleDiffs = null;
      this.scheduleDiffsStatus = 'idle';
      this.groupList = null;
      this.groupListStatus = 'idle';
    })
  }
}

const groupStore = new GroupClass();

export {
  groupStore,
}
