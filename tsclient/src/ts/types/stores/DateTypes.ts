export interface IResponseSemester {
  id: number,
  year: number,
  currentDate: string,
  endDate: string,
  startDate: string,
  season: string,
}

export interface IDateClass {
  date: string,
  weekNumber: number,
  currentWeekNumber: number,
  weekParity: string,
  absoluteWeekParity: string,
  semesterStart: string | null,
  semesterEnd: string | null,
  maxWeekNumber: number | null,
  semesterGETFetch(): void,
  setSemesterDate(semData: IResponseSemester): void,
  getWeekNumber(ISODate: string): number,
  curDate(): void,
  incDate(): void,
  decDate(): void,
  reset(): void,
}

