import { makeAutoObservable } from "mobx";
import { IAttendanceTokenClass } from "../types/AttendanceTokenTypes";

export class AttendanceTokenClass implements IAttendanceTokenClass {
  attendanceToken: string | null;
  isTokenValid: boolean;
  tooManyRequests: boolean;
  loadingStatus: 'idle' | "pending" | "done";

  constructor() {
    makeAutoObservable(this);

    this.deleteToken = this.deleteToken.bind(this);

    this.attendanceToken = null;
    this.isTokenValid = false;
    this.tooManyRequests = false;
    this.loadingStatus = 'idle';
  }

  deleteToken(): void {
    this.attendanceToken = null;
    this.isTokenValid = false;
    this.loadingStatus = 'done';
  }
}

const attendanceTokenStore = new AttendanceTokenClass();

export {
  attendanceTokenStore,
}
