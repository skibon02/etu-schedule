import { createSlice } from "@reduxjs/toolkit";
import { getWeekNumber } from "../../Utils/handleTime";

const dateSlice = createSlice({
  name: 'date',
  initialState: {
    date: (new Date()).toISOString(),
    weekNumber: getWeekNumber(new Date()),
  },
  reducers: {
    setDate: (s, a) => {
      s.date = (a.payload).toISOString();
      s.weekNumber = getWeekNumber(a.payload);
      console.log('date is:\n', s.date);
      console.log('weekNumber is:\n', s.weekNumber);
    }
  }
});

export default dateSlice.reducer;
export const {setDate} = dateSlice.actions;