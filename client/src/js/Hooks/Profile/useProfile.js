import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { groupListGETFetch } from "../../ReduxStates/Slices/groupListSlice";

export function useProfile() {
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

  return { active, isAuthorized }
}