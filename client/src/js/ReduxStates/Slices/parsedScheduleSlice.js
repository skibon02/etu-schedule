import { createSlice } from "@reduxjs/toolkit";
import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { isEvenWeek } from "../../Utils/handleTime";

const parsedScheduleSlice = createSlice({
  name: 'parsedSchedule',
  initialState: {
    parsedSchedule1: null,
    parsedSchedule2: null,
    parsedGroupId: null,
  },
  reducers: {
    setParsedSchedule: (s, a) => {
      if (a.payload.groupSchedule && a.payload.groupSchedule.is_ready) {
        if (isEvenWeek(new Date()) === '1') {
          s.parsedSchedule1 = makeSchedule(a.payload.groupSchedule, new Date());
          s.parsedSchedule2 = makeSchedule(a.payload.groupSchedule, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
        } else {
          s.parsedSchedule2 = makeSchedule(a.payload.groupSchedule, new Date());
          s.parsedSchedule1 = makeSchedule(a.payload.groupSchedule, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
        }
        s.parsedGroupId = a.payload.groupId;
      }
    },
  }
});

export default parsedScheduleSlice.reducer
export const {setParsedSchedule} = parsedScheduleSlice.actions;