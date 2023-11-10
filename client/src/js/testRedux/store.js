import { configureStore, combineReducers, getDefaultMiddleware } from '@reduxjs/toolkit'
import counterSlice from './counterSlice'
import groupListSlice from './groupList'
import thunk from 'redux-thunk'

const rootReducer = combineReducers({
  counter: counterSlice,
  groupList: groupListSlice,
})

export default configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => (
    getDefaultMiddleware().concat(thunk)
  )
});
