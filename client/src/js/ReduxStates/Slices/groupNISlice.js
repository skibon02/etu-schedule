import { createSlice } from "@reduxjs/toolkit";

const groupNISlice = createSlice({
  name: 'groupNI',
  initialState: {
    groupNumber: null,
    groupId: null,
  },
  reducers: {
    setGroupNI: (s, a) => {
      s.groupNumber = a.payload.groupNumber;
      s.groupId = a.payload.groupId;
    }
  }
});

export default groupNISlice.reducer;
export const {setGroupNI} = groupNISlice.actions;