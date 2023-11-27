import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import groupListSlice from './Slices/groupListSlice'
import vkDataSlice from './Slices/vkDataSlice'
import activeSlice from './Slices/activeSlice'
import dateSLice from './Slices/dateSLice'
import groupNISlice from './Slices/groupNISlice'
import groupScheduleSlice from './Slices/groupScheduleSlice'
import attendanceTokenSlice from './Slices/attendanceTokenSlice'
import userDataSlice from './Slices/userDataSlice'
import fullNameEnabledSlice from './Slices/fullNameEnabledSlice'
import planningDataSlice from './Slices/planningDataSlice'
import scheduleDiffsSlice from './Slices/scheduleDiffsSlice'

const rootReducer = combineReducers({
  // stateName: sliceName,
  groupList: groupListSlice,
  vkData: vkDataSlice,
  active: activeSlice,
  date: dateSLice,
  groupNI: groupNISlice,
  groupSchedule: groupScheduleSlice,
  attendanceToken: attendanceTokenSlice,
  userData: userDataSlice,
  fullNameEnabled: fullNameEnabledSlice,
  planningData: planningDataSlice,
  scheduleDiffs: scheduleDiffsSlice,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(thunk)
  )
});

export { store }

export const {dispatch} = store.dispatch;
