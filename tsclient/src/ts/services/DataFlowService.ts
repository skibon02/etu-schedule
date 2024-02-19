import { autorun, makeAutoObservable, runInAction } from "mobx";
import { UserDataClass, userDataStore } from "../stores/userDataStore";
import { GroupClass, groupStore } from "../stores/groupStore";
import { AttendanceTokenClass, attendanceTokenStore } from "../stores/attendanceTokenStore";
import { DateClass, dateStore } from "../stores/dateStore";
import { ActiveClass, activeStore } from "../stores/activeStore";
import { makeFetch } from "../utils/makeFetch";
import { IDataFlowClass } from "../types/services/DataFlowServcieTypes";

class DataFlowClass implements IDataFlowClass {
  private userDataStore: UserDataClass;
  private groupStore: GroupClass;
  private attendanceTokenStore: AttendanceTokenClass;
  private dateStore: DateClass;
  private activeStore: ActiveClass;
  renderStatus: "loading" | "notAuth" | "ready";

  constructor(
    userDataStore: UserDataClass,
    groupStore: GroupClass,
    attendanceTokenStore: AttendanceTokenClass,
    dateStore: DateClass,
    activeStore: ActiveClass
  ) {
    makeAutoObservable(this);

    this.deauthFetch = this.deauthFetch.bind(this);
    this.reset = this.reset.bind(this);

    this.userDataStore = userDataStore;
    this.groupStore = groupStore;
    this.attendanceTokenStore = attendanceTokenStore;
    this.dateStore = dateStore;
    this.activeStore = activeStore;
    this.renderStatus = "loading";

    autorun(() => {
      if (this.dateStore.semesterStart === null) {
        runInAction(() => {
          this.renderStatus = "loading";
        })
      } else if (this.userDataStore.vkData === null) {
        runInAction(() => {
          this.renderStatus = "loading";
        })
      } else if (!this.userDataStore.vkData.is_authorized) {
        runInAction(() => {
          this.renderStatus = "notAuth";
        })
      } else if (this.userDataStore.vkData !== null && this.dateStore.semesterStart !== null) {
        runInAction(() => {
          this.renderStatus = "ready";
        })
      }
    });
  }

  async deauthFetch() {
    await makeFetch(
      '/api/auth/deauth',
      { method: "POST" },
      () => {},
      () => {},
      'выйти из профиля'
    )
    runInAction(() => {
      this.renderStatus = "loading";
      this.reset();
    })
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

const DataFlowService = new DataFlowClass(
  userDataStore,
  groupStore,
  attendanceTokenStore,
  dateStore,
  activeStore
);

export {
  DataFlowService
}
