import { makeAutoObservable, runInAction } from "mobx";
import { IuserData, IfullNameEnabled, IvkData } from "../types/UserDataTypes"
import { makeFetch } from "../utils/makeFetch";

export class UserDataClass implements IuserData {
  fullNameEnabled: IfullNameEnabled;
  userId: number | null;
  leaderForGroup: number | null;
  vkData: IvkData | null;

  constructor() {
    makeAutoObservable(this);

    this.fullNameEnabledAuto = this.fullNameEnabledAuto.bind(this);
    this.fullNameEnabledShort = this.fullNameEnabledShort.bind(this);
    this.userDataSETFetch = this.userDataSETFetch.bind(this);
    this.vkDataGETFetch = this.vkDataGETFetch.bind(this);

    this.fullNameEnabled = {
      value: 'auto',
      label: 'Авто',
    };
    this.userId = null;
    this.leaderForGroup = null;
    this.vkData = null;
  }

  async userDataSETFetch() {
    makeFetch(
      '/api/user/set_data',
      {
        method: "POST",
        body: JSON.stringify({
          subjects_title_formatting: this.fullNameEnabled,
        })
      },
      () => {},
      () => {}
    )
  }

  async vkDataGETFetch() {
    makeFetch(
      '/api/auth/data',
      {},
      (d: IvkData) => {
        this.vkData = d;
      },
      () => {}
    )
  }

  fullNameEnabledAuto(): void {
    runInAction(() => {
      this.fullNameEnabled.label = 'Авто';
      this.fullNameEnabled.value = 'auto';
    })
  }

  fullNameEnabledShort(): void {
    runInAction(() => {
      this.fullNameEnabled.label = 'Сокращённое';
      this.fullNameEnabled.value = 'short';
    })
  }
}

const userDataStore = new UserDataClass();

export {
  userDataStore,
}
