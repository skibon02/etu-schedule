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

async function groupNIGETFetch(dispatch) {
  let r = await myfetch('/api/user/get_group');
  let d = await r.json();

  if (d.current_group !== null) {
    dispatch(setGroupNI({
      groupId: d.current_group.group_id,
      groupNumber: d.current_group.number,
    }));
  }
}

const groupNISlice = createSlice({
  name: 'groupNI',
  initialState: {
    groupNumber: null,
    groupId: null,
    groupNILoading: true
  },
  reducers: {
    setGroupNI: (s, a) => {
      s.groupNumber = a.payload.groupNumber;
      s.groupId = a.payload.groupId;
      s.groupNILoading = false;
      console.log('setted id:', s.groupId);
    }
  },
});


export default groupNISlice.reducer;
export {groupNISETFetch, groupNIGETFetch} 
export const {setGroupNI} = groupNISlice.actions;
