import { createSlice } from '@reduxjs/toolkit';
import myfetch from '../../FxFetches/myfetch';

async function attendanceTokenSETFetch(dispatch, token) {
  let r = await myfetch('/api/user/set_attendance_token', {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      attendance_token: token,
    })
  });
  let d = await r.json();
  if (d.ok && d.result_code === 'success') {
    dispatch(setAttendanceToken(token));
  } else {
    dispatch(trueBadAttendanceToken());
  }
}

const attendanceTokenSlice = createSlice({
  name: 'attendanceToken',
  initialState: {
    attendanceToken: null,
    groupChanged: false,
    badAttendanceToken: false,
  },
  reducers: {
    setAttendanceToken: (s, a) => {
      s.attendanceToken = a.payload;
      if (a.payload !== null) {
        s.groupChanged = true;
      }
      s.badAttendanceToken = false;
      console.log('attendance token is:', s.attendanceToken);
    },
    nullAttendanceToken: (s) => {
      s.attendanceToken = null;
      s.groupChanged = false;
      s.badAttendanceToken = false;
      console.log('attendance token is:', s.attendanceToken);
    },
    trueBadAttendanceToken: (s) => {
      s.badAttendanceToken = true;
      console.log('bad attendance token!');
    } 
  },
});

export default attendanceTokenSlice.reducer
export {attendanceTokenSETFetch}
export const {setAttendanceToken, nullAttendanceToken, trueBadAttendanceToken} = attendanceTokenSlice.actions;
