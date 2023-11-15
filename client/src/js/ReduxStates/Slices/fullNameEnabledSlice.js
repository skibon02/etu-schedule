import { createSlice } from "@reduxjs/toolkit";

const fullNameEnabledSlice = createSlice({
  name: 'fullNameEnabled',
  initialState: {
    fullNameEnabledValue: 'auto',
    fullNameEnabledLabel: 'Авто',
  },
  reducers: {
    setFullNameEnabled: (s, a) => {
      s.fullNameEnabledValue = a.payload;
      if (a.payload === 'auto') {
        s.fullNameEnabledLabel = 'Авто';
      } else {
        s.fullNameEnabledLabel = 'Сокращённое';
      }
      console.log('fullNameEnabledValue:\n', s.fullNameEnabledValue);
      console.log('fullNameEnabledLabel:\n', s.fullNameEnabledLabel);
    }
  }
});

export default fullNameEnabledSlice.reducer
export const {setFullNameEnabled} = fullNameEnabledSlice.actions;