import { createSlice } from "@reduxjs/toolkit";
import { getWeekNumber } from "../../Utils/handleTime";
import myfetch from "../../FxFetches/myfetch";

const dateSlice = createSlice({
  name: 'date',
  initialState: {
    date: (new Date()).toISOString(),
    weekNumber: null,
    semesterStart: null,
    maxWeekNumber: null,
  },
  reducers: {
    setDate: (s, a) => {
      s.date = a.payload;
      s.weekNumber = getWeekNumber(s.semesterStart, a.payload) - 1;
      console.log('date is:\n', s.date);
      console.log('weekNumber is:\n', s.weekNumber);
    },
    setSemesterDate: (s, a) => {
      s.semesterStart = a.payload.startDate;
      s.maxWeekNumber = getWeekNumber(a.payload.startDate, a.payload.endDate);
      s.weekNumber = getWeekNumber(a.payload.startDate, s.date);
      console.log('updated weekNumber:', s.weekNumber);
      console.log('updated maxWeekNumber:', s.maxWeekNumber);
    }
  }
});


async function semesterStartFetch(dispatch) {
  let r = await myfetch('/api/semester');
  let d = await r.json();

  if (d.startDate) {
    dispatch(setSemesterDate(d));
  }

  console.log('fetched semester date: ', d);
}

export default dateSlice.reducer;
export const {setDate, setSemesterDate} = dateSlice.actions;
export {
  semesterStartFetch
}