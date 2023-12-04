import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { groupListGETFetch } from "../../ReduxStates/Slices/groupListSlice";
import ProfileUserInfo from "./ProfileUserInfo";
import UserPreferences from "./UserPreferences";

export default function Profile() {
  const dispatch = useDispatch();

  const { groupList } = useSelector(s => s.groupList);
  const { vkData } = useSelector(s => s.vkData);
  
  const isAuthorized = vkData.is_authorized;

  useEffect(() => {
    if (!groupList && isAuthorized) {
      dispatch(groupListGETFetch())
    };
  }, [vkData]);

  return (
    <>
    <div className="profile schedule modal-transition">
      <ProfileUserInfo />
      {isAuthorized && <UserPreferences />}
    </div>
    </>
  )
}
