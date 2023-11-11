import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';

const groupListFetch = createAsyncThunk('groups/groupListFetch', async () => {
  try {
    const response = await myfetch('/api/groups');
    const data = await response.json();

    let groups = [];
    for (let k of Object.keys(data)) {
      groups.push({
        ...data[k],
        id: k
      });
    }
    console.log('groups:\n', groups);

    return groups;
  } catch (error) {
    throw error; // Rethrow the error to be caught by groupListFetch.rejected
  }
});

const groupListSlice = createSlice({
  name: 'groupList',
  initialState: {
    groupList: null,
    groupListStatus: 'idle',
    groupListError: null,
  },
  reducers: {
    setGroupList: (s, a) => {
      s.groupList = a.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(groupListFetch.pending, (s) => {
        s.groupListStatus = 'loading';
      })
      .addCase(groupListFetch.fulfilled, (s, a) => {
        s.groupListStatus = 'succeeded';
        s.groupList = a.payload;
      })
      .addCase(groupListFetch.rejected, (s, a) => {
        s.groupListStatus = 'failed';
        s.groupListError = a.error.message;
      });
  },
});

export default groupListSlice.reducer
export {groupListFetch}
export const {setGroupList} = groupListSlice.actions;
