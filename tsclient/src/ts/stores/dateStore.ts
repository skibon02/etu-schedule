import { makeAutoObservable } from "mobx";
import myfetch from "../utils/myfetch";
import { IDateClass, IResponseSemester } from "../types/DateTypes";

const weekTime = 7 * 24 * 60 * 60 * 1000;

export class DateClass implements IDateClass {
  date: string;
  weekNumber: number;
  currentWeekNumber: number;
  weekParity: string;
  absoluteWeekParity: string;
  semesterStart: string | null;
  maxWeekNumber: number | null;

  constructor() {
    makeAutoObservable(this);

    this.semesterGetFetch = this.semesterGetFetch.bind(this);
    this.setSemesterDate = this.setSemesterDate.bind(this);
    this.getWeekNumber = this.getWeekNumber.bind(this);
    this.curDate = this.curDate.bind(this);
    this.decDate = this.decDate.bind(this);
    this.incDate = this.incDate.bind(this);

    this.date = (new Date()).toISOString();
    this.weekNumber = this.getWeekNumber(this.date);
    this.currentWeekNumber = this.getWeekNumber(this.date);
    this.weekParity = this.weekNumber % 2 ? '2' : '1';
    this.absoluteWeekParity = this.getWeekNumber((new Date()).toISOString()) % 2 ? '2' : '1';
    this.semesterStart = null;
    this.maxWeekNumber = null;
  }

  async semesterGetFetch() {
    try {
      const r = await myfetch('/api/semester');
      if (r.status === 200) {
        const d: IResponseSemester = await r.json();
        console.log('Fetch on semester:', d);
        if (d.startDate) {
          this.setSemesterDate(d);
        }
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error fetching semester data:', e.message);
    }
  }

  setSemesterDate(semData: IResponseSemester): void {
    this.semesterStart = semData.startDate;
    this.maxWeekNumber = this.getWeekNumber(this.semesterStart);
  }

  getWeekNumber (ISODate: string): number {
    const startDate = new Date(this.semesterStart!).getTime();
    const today = new Date(ISODate).getTime();

    const daysDiff = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
    const weeksDiff = Math.floor(daysDiff / 7);

    return weeksDiff;
  }

  curDate(): void {
    this.date = new Date().toISOString();
    this.weekNumber = this.getWeekNumber(this.date);
    this.weekParity = this.weekNumber % 2 ? '2' : '1';
  }

  incDate(): void {
    this.date = new Date(
      new Date().getTime() + weekTime
    ).toISOString();
    this.weekNumber = this.weekNumber + 1;
    this.weekParity = this.weekNumber % 2 ? '2' : '1';
  }

  decDate(): void {
    this.date = new Date(
      new Date().getTime() - weekTime
    ).toISOString();
    this.weekNumber = this.weekNumber - 1;
    this.weekParity = this.weekNumber % 2 ? '2' : '1';
  }
}

const dateStore = new DateClass();

export {
  dateStore,
}
