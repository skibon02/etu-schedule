import { createSlice } from "@reduxjs/toolkit";
import makeSchedule from "../../Utils/Schedule/parseSchedule";
import { isEvenWeek } from "../../Utils/handleTime";

const parsedScheduleSlice = createSlice({
  name: 'parsedSchedule',
  initialState: {
    parsedSchedule1: null,
    parsedSchedule2: null,
  },
  reducers: {
    setParsedSchedule: (s, a) => {
      if (a.payload && a.payload.is_ready) {
        if (isEvenWeek(new Date()) === '1') {
          s.parsedSchedule1 = makeSchedule(a.payload, new Date());
          s.parsedSchedule2 = makeSchedule(a.payload, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
        } else {
          s.parsedSchedule2 = makeSchedule(a.payload, new Date());
          s.parsedSchedule1 = makeSchedule(a.payload, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
        }
        console.log('week schedule from parseSchedule (week 1):\n', s.parsedSchedule1);
        console.log('week schedule from parseSchedule (week 2):\n', s.parsedSchedule2);
      }
    }
  }
});

export default parsedScheduleSlice.reducer
export const {setParsedSchedule} = parsedScheduleSlice.actions;