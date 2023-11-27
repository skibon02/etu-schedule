import { createSlice } from "@reduxjs/toolkit";

const activeSlice = createSlice({
  name: 'active',
  initialState: {
    active: 'profile',
  },
  reducers: {
    setActive: (s, a) => {
      s.active = a.payload;
      console.log('active:\n', s.active);
    }
  }
});

export default activeSlice.reducer
export const {setActive} = activeSlice.actions;
