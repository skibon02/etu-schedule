import { createSlice } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';

async function groupNISETFetch(groupId) {
  let response = await myfetch('/api/user/set_group', {
    body: JSON.stringify({group_id: +groupId}),
    method: "POST",
    credentials: "include",
  });
  let data = await response.json();
  console.log('set_group fetch:\n', data);
  return data;
}

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
      console.log('setted id:', s.groupId);
    }
  },
});


export default groupNISlice.reducer;
export {groupNISETFetch} 
export const {setGroupNI} = groupNISlice.actions;