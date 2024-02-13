import { makeAutoObservable, runInAction } from "mobx";
import myfetch from "../utils/myfetch";
import { IuserData, IfullNameEnabled } from "../types/UserDataTypes"

export class UserDataClass implements IuserData {
  fullNameEnabled: IfullNameEnabled;
  userId: number | null;
  leaderForGroup: number | null;

  constructor() {
    makeAutoObservable(this);

    this.fullNameEnabledAuto = this.fullNameEnabledAuto.bind(this);
    this.fullNameEnabledShort = this.fullNameEnabledShort.bind(this);
    this.userDataSETFetch = this.userDataSETFetch.bind(this);

    this.fullNameEnabled = {
      value: 'auto',
      label: 'Авто',
    };
    this.userId = null;
    this.leaderForGroup = null;
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

  async userDataSETFetch() {
    try {
      const r = await myfetch('/api/user/set_data', {
        method: "POST",
        credentials: "include", 
        body: JSON.stringify({
          subjects_title_formatting: this.fullNameEnabled,
        }),
      });
      if (r.status === 200) {
        const d = await r.json();
        console.log('successfully fetched set_data:', d);
      } else {
        throw new Error(`${r.status}`);
      }
    } catch (error) {
      const e = error as Error;
      console.error('Error in set_data fetch:', e.message);
    }
  }
}

const userDataStore = new UserDataClass();

export {
  userDataStore,
}
