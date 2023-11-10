import { createSlice } from "@reduxjs/toolkit";

const activeSlice = createSlice({
  name: 'active',
  initialState: {
    active: 'profile',
  },
  reducers: {
    setActive: (s, a) => {
      s.active = a.payload;
    }
  }
});

export default activeSlice.reducer
export const {setActive} = activeSlice.actions;