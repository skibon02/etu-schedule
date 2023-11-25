import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { groupListFetch } from "../../ReduxStates/Slices/groupListSlice";
import ProfileUserInfo from "./ProfileUserInfo";
import UserPreferences from "./UserPreferences";

export default function Profile() {
  const dispatch = useDispatch();

  const {groupList, groupListStatus, groupListError } = useSelector(s => s.groupList);
  const {vkData, vkDataStatus, vkDataError } = useSelector(s => s.vkData);
  
  const isAuthorized = vkData.is_authorized;

  useEffect(() => {
    if (!groupList && isAuthorized) {
      dispatch(groupListFetch())
    };
  }, [vkData]);

  return (
    <>
    <div className="profile schedule">
      <ProfileUserInfo />
      {isAuthorized && <UserPreferences />}
    </div>
    </>
  )
}
