import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';
import { scheduleDiffsGETFetch } from './scheduleDiffsSlice';

const planningDataGETFetch = createAsyncThunk('groups/planningDataGETFetch', async () => {
  try {
    let response = await myfetch(`/api/attendance/schedule`);
    let data = await response.json();

    return data;
  } catch (error) {
    throw error; 
  }
});

async function planningDataSETFetch(dispatch, time_link_id, flag) {
  try {
    let r = await myfetch(`/api/attendance/schedule/update`, {
      body: JSON.stringify({
        schedule_obj_time_link_id: +time_link_id, 
        enable_auto_attendance: flag
      }),
      method: "POST",
      credentials: "include",
    });
    let d = await r.json();
  
    console.log('result of changing planning Data\n', d);

    if (d.ok) {
      dispatch(planningDataGETFetch());
      dispatch(scheduleDiffsGETFetch());
    }
  } catch (error) {
    console.error(error.message);
  }
}

const planningDataSlice = createSlice({
  name: 'planningData',
  initialState: {
    planningData: null,
    planningDataStatus: 'idle',
    planningDataError: null,
  },
  reducers: {
    setPlanningData: (s, a) => {
      s.planningData = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(planningDataGETFetch.pending, (s) => {
        s.planningDataStatus = 'loading';
      })
      .addCase(planningDataGETFetch.fulfilled, (s, a) => {
        s.planningDataStatus = 'succeeded';
        s.planningData = a.payload;
        console.log('planning Data is:\n', s.planningData);
      })
      .addCase(planningDataGETFetch.rejected, (s, a) => {
        s.planningDataStatus = 'failed';
        s.planningDataError = a.error.message;
      });
  },
});

export default planningDataSlice.reducer
export {planningDataGETFetch}
export {planningDataSETFetch}
export const {setPlanningData} = planningDataSlice.actions;
