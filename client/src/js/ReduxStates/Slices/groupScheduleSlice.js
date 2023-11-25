import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';
import makeSchedule from '../../Utils/Schedule/parseSchedule';
import { isEvenWeek } from '../../Utils/handleTime';

const groupScheduleFetch = createAsyncThunk('groups/groupScheduleFetch', async (groupId) => {
  try {
    const response = await myfetch(`/api/scheduleObjs/group/${groupId}`);
    const data = await response.json();
    console.log('successful fetch on Schedule\nresponse.json():\n', data);

    return data;

  } catch (error) {
    throw error; // Rethrow the error to be caught by groupScheduleFetch.rejected
  }
});

const groupScheduleSlice = createSlice({
  name: 'groupSchedule',
  initialState: {
    groupSchedule: null,
    groupScheduleStatus: 'idle',
    groupScheduleError: null,
    parsedSchedule1: null,
    parsedSchedule2: null,
  },
  reducers: {
    setGroupSchedule: (s, a) => {
      s.groupSchedule = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(groupScheduleFetch.pending, (s) => {
        s.groupScheduleStatus = 'loading';
      })
      .addCase(groupScheduleFetch.fulfilled, (s, a) => {
        s.groupListStatus = 'succeeded';
        s.groupSchedule = a.payload;
        if (a.payload && a.payload.is_ready) {
          if (isEvenWeek(new Date()) === '1') {
            s.parsedSchedule1 = makeSchedule(a.payload, new Date());
            s.parsedSchedule2 = makeSchedule(a.payload, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
          } else {
            s.parsedSchedule2 = makeSchedule(a.payload, new Date());
            s.parsedSchedule1 = makeSchedule(a.payload, new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7));
          }
        }
      })
      .addCase(groupScheduleFetch.rejected, (s, a) => {
        s.groupScheduleStatus = 'failed';
        s.groupScheduleError = a.error.message;
      });
  },
});

export default groupScheduleSlice.reducer;
export {groupScheduleFetch}
export const {setGroupSchedule} = groupScheduleSlice.actions;
