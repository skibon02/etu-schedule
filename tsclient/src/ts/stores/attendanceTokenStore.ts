import { makeAutoObservable, runInAction } from "mobx";
import { IAttendanceTokenClass } from "../types/stores/AttendanceTokenTypes";
import { makeFetch } from "../utils/makeFetch";

export class AttendanceTokenClass implements IAttendanceTokenClass {
  attendanceToken: string | null;
  isTokenValid: boolean;
  tooManyRequests: boolean;
  loadingStatus: 'idle' | "pending" | "done";

  constructor() {
    makeAutoObservable(this);

    this.deleteTokenFetch = this.deleteTokenFetch.bind(this);
    this.reset = this.reset.bind(this);
    this.nullToken = this.nullToken.bind(this);

    this.attendanceToken = null;
    this.isTokenValid = true;
    this.tooManyRequests = false;
    this.loadingStatus = 'idle';
  }

  deleteTokenFetch(): void {
    this.loadingStatus = 'pending';
    makeFetch(
      '/api/user/set_attendance_token', 
      {
        method: "POST",
        body: JSON.stringify({
          attendance_token: null,
        })
      }, 
      () => {
        this.nullToken();
      }, 
      () => {},
      'удалить токен'
    )
  }

  nullToken(): void {
    runInAction(() => {
      this.attendanceToken = null;
      this.isTokenValid = true;
      this.tooManyRequests = false;
      this.loadingStatus = 'done';
    })
  }

  resetTooManyRequests(): void {
    runInAction(() => {
      this.tooManyRequests = false;
    })
  }

  reset(): void {
    runInAction(() => {
      this.attendanceToken = null;
      this.isTokenValid = true;
      this.tooManyRequests = false;
      this.loadingStatus = 'idle';
    })
  }
}

const attendanceTokenStore = new AttendanceTokenClass();

export {
  attendanceTokenStore,
}
