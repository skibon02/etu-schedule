import { CSSTransition } from "react-transition-group";
import { activeStore } from "../../stores/activeStore";
import { userDataStore } from "../../stores/userDataStore";
import { useEffect } from "react";
import { groupStore } from "../../stores/groupStore";
import ProfileUserInfo from "./ProfileUserInfo";
import UserPreferences from "./UserPreferences";

export default function Profile() {

  useEffect(() => {
    groupStore.groupListGETFetch();
  }, [userDataStore.vkData?.is_authorized]);

  return (
    <>
    <CSSTransition in={activeStore.active === 'profile'} timeout={300} classNames={'modal-transition'} unmountOnExit>
    <div className="profile schedule modal-transition">
      <ProfileUserInfo />
      {userDataStore.vkData?.is_authorized && <UserPreferences />}
    </div>
    </CSSTransition>
    </>
  )
}
