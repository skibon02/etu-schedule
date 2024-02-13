import { makeAutoObservable } from "mobx";
import { IGroupClass, IGroupSchedule, IscheduleDiff, IscheduleDiffs, parsedSchedule } from "../types/GroupTypes";
import myfetch from "../utils/myfetch";

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
    try {
      const r = await myfetch('/api/attendance/schedule_diffs');
      if (r.status === 200) {
        const d = await r.json();
        console.log('successfully fetched on schedule diffs:', d);

        this.scheduleDiffs = d;
      } else {
        throw new Error(`${r.status}`)
      }
    } catch (error) {
      const e = error as Error;
      console.error('Failed to fetch schedule diffs:', e.message);
    }
  }

  async schedulePlanningGETFetch() {
    try {
      const r = await myfetch(`/api/attendance/schedule`);
      if (r.status === 200) {
        const d = await r.json();
        console.log('successfully fetched on schedule planning:', d);

        this.schedulePlanning = d;
      } else {
        throw new Error(`${r.status}`)
      }
    } catch (error) {
      const e = error as Error;
      console.error('Failed to fetch schedule planning:', e.message);
    }
  }
}

const groupStore = new GroupClass();

export {
  groupStore,
}
