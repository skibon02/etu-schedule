import { computed, makeAutoObservable, runInAction } from "mobx";
import { IDateClass, IResponseSemester } from "../types/stores/DateTypes";
import { makeFetch } from "../utils/makeFetch";

export const weekTime = 7 * 24 * 60 * 60 * 1000;

export class DateClass implements IDateClass {
  date: string;
  weekNumber: number;
  currentWeekNumber: number;
  weekParity: string;
  absoluteWeekParity: string;
  semesterStart: string | null;
  semesterEnd: string | null;
  maxWeekNumber: number | null;

  constructor() {
    makeAutoObservable(this);

    this.semesterGETFetch = this.semesterGETFetch.bind(this);
    this.setSemesterDate = this.setSemesterDate.bind(this);
    this.getWeekNumber = this.getWeekNumber.bind(this);
    this.curDate = this.curDate.bind(this);
    this.decDate = this.decDate.bind(this);
    this.incDate = this.incDate.bind(this);
    this.reset = this.reset.bind(this);

    this.date = (new Date()).toISOString();
    this.weekNumber = 0;
    this.currentWeekNumber = this.getWeekNumber(this.date);
    this.weekParity = this.weekNumber % 2 ? '2' : '1';
    this.absoluteWeekParity = this.getWeekNumber((new Date()).toISOString()) % 2 ? '2' : '1';
    this.semesterStart = null;
    this.semesterEnd = null;
    this.maxWeekNumber = null;
  }
  
  async semesterGETFetch() {
    makeFetch(
      '/api/semester',
      {},
      (d: IResponseSemester) => {
        if (d.startDate) {
          this.setSemesterDate(d);
        }
      },
      () => {},
      'загрузить данные о семестре'
    )
  }

  setSemesterDate(semData: IResponseSemester): void {
    runInAction(() => {
      this.semesterStart = semData.startDate;
      this.semesterEnd = semData.endDate;
      this.maxWeekNumber = this.getWeekNumber(this.semesterEnd);
      this.weekNumber = this.getWeekNumber(this.date);
    })
  }

  getWeekNumber (ISODate: string): number {
    const startDate = new Date(this.semesterStart!).getTime();
    const today = new Date(ISODate).getTime();

    const daysDiff = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
    const weeksDiff = Math.floor(daysDiff / 7);

    return weeksDiff;
  }

  curDate(): void {
    runInAction(() => {
      this.date = new Date().toISOString();
      this.weekNumber = this.getWeekNumber(this.date);
      this.weekParity = this.weekNumber % 2 ? '2' : '1';
    })
  }

  incDate(): void {
    runInAction(() => {
      this.date = new Date(
        new Date(this.date).getTime() + weekTime
      ).toISOString();
      this.weekNumber = this.weekNumber + 1;
      this.weekParity = this.weekNumber % 2 ? '2' : '1';
    })
  }

  decDate(): void {
    runInAction(() => {
      this.date = new Date(
        new Date(this.date).getTime() - weekTime
      ).toISOString();
      this.weekNumber = this.weekNumber - 1;
      this.weekParity = this.weekNumber % 2 ? '2' : '1';
    })
  }

  reset(): void {
    runInAction(() => {
      this.date = (new Date()).toISOString();
      this.weekNumber = this.getWeekNumber(this.date);
      this.currentWeekNumber = this.getWeekNumber(this.date);
      this.weekParity = this.weekNumber % 2 ? '2' : '1';
      this.absoluteWeekParity = this.getWeekNumber((new Date()).toISOString()) % 2 ? '2' : '1';
      this.semesterStart = null;
      this.semesterEnd = null;
      this.maxWeekNumber = null;
    })
  }
}

const dateStore = new DateClass();

export {
  dateStore,
}
