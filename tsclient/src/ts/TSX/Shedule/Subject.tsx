import { observer } from "mobx-react";
import { useSubject } from "../../hooks/Schedule/useSubject";
import { activeStore } from "../../stores/activeStore";
import { makeClockTime, truncateString } from "../../utils/Schedule/utils";
import { ISubjectProps } from "../../types/tsx/Schedule/SubjectTypes";
import { ObsGroupEditor, ObsUserEditor } from "./TextEditor";
import Attendance from "./Attendance";
import PlanningSwitch from "../Planning/PlanningSwitch";
import { userDataStore } from "../../stores/userDataStore";

function Subject({subjectData, orderNumber, planning_time_link_id_value, schedule_diffs_value}: ISubjectProps) {
  const { lessonStart, lessonEnd, lessonName, lessonType, teachers, time_link_id, roomName, isDead, 
    activeModal, setActiveModal, userText, setUserText, groupText, setGroupText, 
    handleUserNoteClick, handleUserNoteTitleClick, handleGroupNoteClick, handleGroupNoteTitleClick 
  } = useSubject(subjectData, orderNumber);

  return (
    <div className={activeStore.active === 'schedule' && isDead ? 
      "day__lesson lesson disabled-font" : 
      "day__lesson lesson"}>
      <div className="lesson__info">
        <div className="lesson__time">
          <div className={
            activeStore.active === 'schedule' && isDead ? 
            "lesson__start disabled-font" :
            "lesson__start"}>
            {makeClockTime(lessonStart)}
          </div>
          <div className={
            activeStore.active === 'schedule' && isDead ? 
            "lesson__end disabled-font" :
            "lesson__end"}>
            {makeClockTime(lessonEnd)}
          </div>
        </div>
        <div className="lesson__about">
          <div className="lesson__name">
            {lessonName}
          </div>
          <div className="lesson__teachers">
            {teachers}
          </div>
          {activeStore.active === 'schedule' && 
          <div className="lesson__notes">
            <div className="lesson__user-note lesson__note" role="button" onClick={handleUserNoteClick}>
              <div className="lesson__note-title" role="button" onClick={handleUserNoteTitleClick}>
                <div className="lesson__user-note-icon lesson__note-icon"></div>
                {truncateString(userText, 12) && <div className="lesson__user-note-text lesson__note-text">{activeModal === 'user' ? truncateString(userText, 20) : truncateString(userText, 12)}</div>}
              </div>
              <ObsUserEditor time_link_id={subjectData.time_link_id} activeModal={activeModal} setActiveModal={setActiveModal} text={userText} setText={setUserText} />
            </div>
            {(userDataStore.leaderForGroup || truncateString(groupText, 12) !== '') &&
            <div className="lesson__group-note lesson__note" role="button" onClick={handleGroupNoteClick}>
              <div className="lesson__note-title" role="button" onClick={handleGroupNoteTitleClick}>
                <div className="lesson__group-note-icon lesson__note-icon"></div>
                {truncateString(groupText, 12) && <div className="lesson__group-note-text lesson__note-text">{activeModal === 'group' ? truncateString(groupText, 20) : truncateString(groupText, 12)}</div>}
              </div>
              <ObsGroupEditor time_link_id={subjectData.time_link_id} activeModal={activeModal} setActiveModal={setActiveModal} text={groupText} setText={setGroupText} />
            </div>
            }
          </div>
          }
        </div>
        <div className="lesson__type-room lesson-type-room">
          <p className={activeStore.active === 'schedule' &&  isDead ? 
            "lesson-type-room__type disabled-font disabled-bg" :
            "lesson-type-room__type" }>
              {lessonType}
          </p>
          {roomName}
        </div>
      </div>
      {activeStore.active === 'schedule' &&
      <Attendance 
        key={planning_time_link_id_value ? 1 : 0}
        isDead={isDead}
        time_link_id={time_link_id}
        schedule_diffs_value={schedule_diffs_value}
        planning_time_link_id_value={planning_time_link_id_value} />
      }
      {activeStore.active === 'planning' && 
      <PlanningSwitch 
        time_link_id={time_link_id} 
        planning_time_link_id_value={planning_time_link_id_value} />
      }
    </div>
  )
}


export default observer(Subject);
