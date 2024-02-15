import { runInAction } from "mobx";
import { UserDataClass, userDataStore } from "../stores/userDataStore";
import { GroupClass, groupStore } from "../stores/groupStore";
import { AttendanceTokenClass, attendanceTokenStore } from "../stores/attendanceTokenStore";
import { DateClass, dateStore } from "../stores/dateStore";
import { ActiveClass, acitveStore } from "../stores/activeStore";
import { makeFetch } from "../utils/makeFetch";
import { IResetClass } from "../types/services/ResetServiceTypes";

class ResetClass implements IResetClass {
  private userDataStore: UserDataClass;
  private groupStore: GroupClass;
  private attendanceTokenStore: AttendanceTokenClass;
  private dateStore: DateClass;
  private activeStore: ActiveClass;

  constructor(
    userDataStore: UserDataClass,
    groupStore: GroupClass,
    attendanceTokenStore: AttendanceTokenClass,
    dateStore: DateClass,
    activeStore: ActiveClass
  ) {
    this.deauthFetch = this.deauthFetch.bind(this);
    this.reset = this.reset.bind(this);

    this.userDataStore = userDataStore;
    this.groupStore = groupStore;
    this.attendanceTokenStore = attendanceTokenStore;
    this.dateStore = dateStore;
    this.activeStore = activeStore;
  }

  async deauthFetch() {
    makeFetch(
      '/api/auth/deauth',
      { method: "POST" },
      () => {
        this.reset();
      },
      () => {}
    )
  }

  reset(): void {
    runInAction(() => {
      this.userDataStore.reset();
      this.groupStore.reset();
      this.attendanceTokenStore.reset();
      this.dateStore.reset();
      this.activeStore.reset();
    })
  }
}

const ResetService = new ResetClass(
  userDataStore,
  groupStore,
  attendanceTokenStore,
  dateStore,
  acitveStore
);

export {
  ResetService
}
