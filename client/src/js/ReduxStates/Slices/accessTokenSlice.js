import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';

const accessTokenFetch = createAsyncThunk('groups/accessTokenFetch', async (token) => {
  try {
    let response = await myfetch(`/api/AcessToken/update/${token}`);
    let data = await response.json();

    console.log('access token successfuly updated!');

    return data;
  } catch (error) {
    throw error; // Rethrow the error to be caught by accessTokenFetch.rejected
  }
});

const vkDataSlice = createSlice({
  name: 'accessToken',
  initialState: {
    accessToken: null,
    accessTokenStatus: 'idle',
    accessTokenError: null,
  },
  reducers: {
    setAccessToken: (s, a) => {
      s.accessToken = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(accessTokenFetch.pending, (s) => {
        s.accessTokenStatus = 'loading';
      })
      .addCase(accessTokenFetch.fulfilled, (s, a) => {
        s.vkDataStatus = 'succeeded';
        s.accessToken = a.payload;
      })
      .addCase(accessTokenFetch.rejected, (s, a) => {
        s.accessTokenStatus = 'failed';
        s.accessTokenError = a.error.message;
      });
  },
});

export default vkDataSlice.reducer
export {accessTokenFetch}
export const {setAccessToken} = vkDataSlice.actions;
