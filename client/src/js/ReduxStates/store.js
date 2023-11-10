import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import groupListSlice from './Slices/groupListSlice'
import vkDataSlice from './Slices/vkDataSlice'
import ActiveSlice from './Slices/ActiveSlice'

const rootReducer = combineReducers({
  // stateName: sliceName,
  groupList: groupListSlice,
  vkData: vkDataSlice,
  active: ActiveSlice,
});

export default configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(thunk)
  )
});
