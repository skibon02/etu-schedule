import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { groupListGETFetch } from "../../ReduxStates/Slices/groupListSlice";
import ProfileUserInfo from "./ProfileUserInfo";
import UserPreferences from "./UserPreferences";
import { CSSTransition } from "react-transition-group";

export default function Profile() {
  const dispatch = useDispatch();

  const { groupList } = useSelector(s => s.groupList);
  const { vkData } = useSelector(s => s.vkData);
  const { active } = useSelector(s => s.active);
  
  const isAuthorized = vkData.is_authorized;

  useEffect(() => {
    if (!groupList && isAuthorized) {
      dispatch(groupListGETFetch())
    };
  }, [vkData]);

  return (
    <>
    <CSSTransition in={active === 'profile'} timeout={300} classNames={'modal-transition'} unmountOnExit>
    <div className="profile schedule modal-transition">
      <ProfileUserInfo />
      {isAuthorized && <UserPreferences />}
    </div>
    </CSSTransition>
    </>
  )
}
