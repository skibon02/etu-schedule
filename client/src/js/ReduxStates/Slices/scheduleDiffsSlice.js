import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';
// scheduleDiffs
const scheduleDiffsGETFetch = createAsyncThunk('groups/scheduleDiffsGETFetch', async () => {
  try {
    let response = await myfetch('/api/attendance/schedule_diffs');
    let data = await response.json();

    console.log('schedule diffs is:\n', data);

    return data;
  } catch (error) {
    throw error;
  }
});

async function scheduleDiffsSETFetch(time_link_id, weekNumber, flag) {
  try {
    let r = await myfetch('/api/attendance/schedule_diffs/update', {
      body: JSON.stringify({
        schedule_obj_time_link_id: time_link_id,
        week_num: +weekNumber,
        enable_auto_attendance: flag,
      }),
      credentials: "include",
      method: "POST",
    });
    let d = await r.json();

    console.log('result of schedule diffs fetch:\n', d);
  } catch(error) {
    console.error(error.message)
  }
}

const scheduleDiffsSlice = createSlice({
  name: 'scheduleDiffs',
  initialState: {
    scheduleDiffs: null,
    scheduleDiffsStatus: 'idle',
    scheduleDiffsError: null,
  },
  reducers: {
    setScheduleDiffs: (s, a) => {
      s.scheduleDiffs = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(scheduleDiffsGETFetch.pending, (s) => {
        s.scheduleDiffsStatus = 'loading';
      })
      .addCase(scheduleDiffsGETFetch.fulfilled, (s, a) => {
        s.scheduleDiffsStatus = 'succeeded';
        s.scheduleDiffs = a.payload;
      })
      .addCase(scheduleDiffsGETFetch.rejected, (s, a) => {
        s.scheduleDiffsStatus = 'failed';
        s.scheduleDiffsError = a.error.message;
      });
  },
});

export default scheduleDiffsSlice.reducer
export {scheduleDiffsGETFetch}
export {scheduleDiffsSETFetch}
export const {setScheduleDiffs} = scheduleDiffsSlice.actions;
