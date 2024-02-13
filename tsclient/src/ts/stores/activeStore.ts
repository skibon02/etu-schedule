import { makeAutoObservable } from "mobx";
import { IActiveClass } from "../types/ActiveTypes";

class ActiveClass implements IActiveClass {
  active: "profile" | "schedule" | "planning" = 'profile';

  constructor() {
    makeAutoObservable(this);
  }

  profile = (): void => {
    this.active = 'profile';
  }

  schedule = (): void => {
    this.active = 'schedule';
  }

  planning = (): void => {
    this.active = 'planning';
  }
}

const acitveStore = new ActiveClass();

export  {
  acitveStore,
}
