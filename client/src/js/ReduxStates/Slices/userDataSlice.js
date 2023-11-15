import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';
import { setGroupNI } from './groupNISlice';
import { setFullNameEnabled } from './fullNameEnabledSlice';

const userDataGETFetch = createAsyncThunk('groups/userDataGETFetch', async (dispatch) => {
  try {
    let response = await myfetch('/api/user/get_data');
    let data = await response.json();

    console.log('user data:\n', data);

    dispatch(setGroupNI({
      groupId: data.group.group_id,
      groupNumber: data.group.number,
    }));

    dispatch(setFullNameEnabled(data.subjects_title_formatting));

  } catch (error) {
    throw error;
  }
});

async function userDataSETFetch(preferences) {
  try {
    let r = await myfetch('/api/user/set_data', {
      method: "POST",
      credentials: "include", 
      body: JSON.stringify({
        subjects_title_formatting: preferences.fullNameEnabled,
      }),
    });
    let data = await r.json();
    console.log('user set_data fetch:\n', data);
  } catch (error) {
    console.error(error.message);
  }
}

const userDataSlice = createSlice({
  name: 'userData',
  initialState: {
    userData: null,
    userDataStatus: 'idle',
    userDataError: null,
  },
  reducers: {
    setUserData: (s, a) => {
      s.userData = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(userDataGETFetch.pending, (s) => {
        s.userDataStatus = 'loading';
      })
      .addCase(userDataGETFetch.fulfilled, (s, a) => {
        s.userDataStatus = 'succeeded';
        s.userData = a.payload;
      })
      .addCase(userDataGETFetch.rejected, (s, a) => {
        s.userDataStatus = 'failed';
        s.userDataError = a.error.message;
      });
  },
});

export default userDataSlice.reducer
export {userDataGETFetch}
export {userDataSETFetch}
export const {setUserData} = userDataSlice.actions;
