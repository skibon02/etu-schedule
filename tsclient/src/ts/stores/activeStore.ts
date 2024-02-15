import { makeAutoObservable } from "mobx";
import { IActiveClass } from "../types/stores/ActiveTypes";

export class ActiveClass implements IActiveClass {
  active: "profile" | "schedule" | "planning" = 'profile';

  constructor() {
    makeAutoObservable(this);

    this.profile = this.profile.bind(this);
    this.schedule = this.schedule.bind(this);
    this.planning = this.planning.bind(this);
    this.reset = this.reset.bind(this);

    this.active = 'profile';
  }

  profile(): void {
    this.active = 'profile';
  }

  schedule(): void {
    this.active = 'schedule';
  }

  planning(): void {
    this.active = 'planning';
  }

  reset() {
    this.active = 'profile';
  }
}

const activeStore = new ActiveClass();

export  {
  activeStore,
}
