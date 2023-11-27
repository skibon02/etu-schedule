import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';

const vkDataFetch = createAsyncThunk('groups/vkDataFetch', async () => {
  let response = await myfetch('/api/auth/data');
  let data = await response.json();

  console.log('vk data:\n', data);

  return data;
});

const vkDataSlice = createSlice({
  name: 'vkData',
  initialState: {
    vkData: null,
    vkDataStatus: 'idle',
    vkDataError: null,
  },
  reducers: {
    setVkData: (s, a) => {
      s.vkData = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(vkDataFetch.pending, (s) => {
        s.vkDataStatus = 'loading';
      })
      .addCase(vkDataFetch.fulfilled, (s, a) => {
        s.vkDataStatus = 'succeeded';
        s.vkData = a.payload;
      })
      .addCase(vkDataFetch.rejected, (s, a) => {
        s.vkDataStatus = 'failed';
        s.vkDataError = a.error.message;
      });
  },
});

export default vkDataSlice.reducer
export {vkDataFetch}
export const {setVkData} = vkDataSlice.actions;
