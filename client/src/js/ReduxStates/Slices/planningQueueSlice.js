import { createSlice } from "@reduxjs/toolkit";



const planningQueueSlice = createSlice({
  name: 'planningQueue',
  initialState: {
    planningQueue: [],
    isProcessing: false,
  },
  reducers: {
    planningQueueADD: (s, a) => {
      let arr = s.planningQueue;
      arr.push(a.payload);
      s.planningQueue = arr;
    },
    planningQueueREMOVE: (s) => {
      s.planningQueue = s.planningQueue.slice(1);
    },
    isProcessingFalse: (s) => {
      s.toggleProcess = false;
    },
    isProcessingTrue: (s) => {
      s.toggleProcess = true;
    },
  }
});

export default planningQueueSlice.reducer
export const {planningQueueADD, planningQueueREMOVE, isProcessingFalse, isProcessingTrue} = planningQueueSlice.actions;