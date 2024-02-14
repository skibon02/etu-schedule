import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';
import { scheduleDiffsGETFetch } from './scheduleDiffsSlice';

const planningDataGETFetch = createAsyncThunk('groups/planningDataGETFetch', async () => {
  let response = await myfetch(`/api/attendance/schedule`);
  let data = await response.json();

  return data;
});

async function planningDataSETOneFetch(dispatch, time_link_id, flag) {
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

  dispatch(scheduleDiffsGETFetch());
}

async function planningDataSETAllFetch(dispatch, flag) {
  let r = await myfetch('/api/attendance/schedule/update_all', {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      enable_auto_attendance: flag
    })
  });
  let d = await r.json();
  console.log('result of updating all planning:', d);

  dispatch(scheduleDiffsGETFetch());
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
    },
    setAllPlanningData(s, a) {
      for (let k of Object.keys(s.planningData)) {
        s.planningData[k].auto_attendance_enabled = a.payload;
      }
    },
    setOnePlanningData(s, a) {
      s.planningData[a.payload.t_l_id].auto_attendance_enabled = a.payload.f;
    },
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
export {planningDataSETOneFetch, planningDataSETAllFetch}
export const {setPlanningData, setAllPlanningData, setOnePlanningData} = planningDataSlice.actions;
