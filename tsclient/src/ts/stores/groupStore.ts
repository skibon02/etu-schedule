import { makeAutoObservable, runInAction } from "mobx";
import { IGroupClass, IGroupSchedule, Igroup, IscheduleDiff, IscheduleDiffs, parsedSchedule } from "../types/GroupTypes";
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
  scheduleDiffs: IscheduleDiffs | null;
  groupList: Igroup[] | null;
  groupListStatus:  'idle' | 'pending' | 'done';

  constructor() {
    makeAutoObservable(this);

    this.scheduleDiffsGETFetch = this.scheduleDiffsGETFetch.bind(this);
    this.schedulePlanningGETFetch = this.schedulePlanningGETFetch.bind(this);
    this.groupListGETFetch = this.groupListGETFetch.bind(this);

    this.groupNumber = null;
    this.groupId = null;
    this.groupNumberIdStatus = 'idle';
    this.groupSchedule = null
    this.parsedSchedule1 = null;
    this.parsedSchedule2 = null;
    this.groupScheduleStatus = 'idle';
    this.schedulePlanning = null;
    this.scheduleDiffs = null;
    this.groupList = null;
    this.groupListStatus = 'idle';
  }

  async scheduleDiffsGETFetch() {
    makeFetch(
      '/api/attendance/schedule_diffs',
      {},
      (d: IscheduleDiffs) => {
        this.scheduleDiffs = d;
      },
      () => {}
    )
  }

  async schedulePlanningGETFetch() {
    makeFetch(
      '/api/attendance/schedule',
      {},
      (d: IscheduleDiff) => {
        this.schedulePlanning = d;
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
}

const groupStore = new GroupClass();

export {
  groupStore,
}
