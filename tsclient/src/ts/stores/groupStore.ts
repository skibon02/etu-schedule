import { makeAutoObservable } from "mobx";
import { IGroupClass, IGroupSchedule, IscheduleDiff, IscheduleDiffs, parsedSchedule } from "../types/GroupTypes";
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

  constructor() {
    makeAutoObservable(this);

    this.scheduleDiffsGETFetch = this.scheduleDiffsGETFetch.bind(this);
    this.schedulePlanningGETFetch = this.schedulePlanningGETFetch.bind(this);

    this.groupNumber = null;
    this.groupId = null;
    this.groupNumberIdStatus = 'idle';
    this.groupSchedule = null
    this.parsedSchedule1 = null;
    this.parsedSchedule2 = null;
    this.groupScheduleStatus = 'idle';
    this.schedulePlanning = null;
    this.scheduleDiffs = null;
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
}

const groupStore = new GroupClass();

export {
  groupStore,
}
