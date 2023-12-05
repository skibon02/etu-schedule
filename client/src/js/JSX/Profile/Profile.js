import { CSSTransition } from "react-transition-group";
import { useProfile } from "../../Hooks/Profile/useProfile";
import ProfileUserInfo from "./ProfileUserInfo";
import UserPreferences from "./UserPreferences";

export default function Profile() {
  const { active, isAuthorized } = useProfile();

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
