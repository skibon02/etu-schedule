import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import groupListSlice from './Slices/groupListSlice'
import vkDataSlice from './Slices/vkDataSlice'
import activeSlice from './Slices/activeSlice'
import dateSLice from './Slices/dateSLice'
import groupNISlice from './Slices/groupNISlice'
import groupScheduleSlice from './Slices/groupScheduleSlice'
import accessTokenSlice from './Slices/accessTokenSlice'

const rootReducer = combineReducers({
  // stateName: sliceName,
  groupList: groupListSlice,
  vkData: vkDataSlice,
  active: activeSlice,
  date: dateSLice,
  groupNI: groupNISlice,
  groupSchedule: groupScheduleSlice,
  accessToken: accessTokenSlice
});

export default configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(thunk)
  )
});
