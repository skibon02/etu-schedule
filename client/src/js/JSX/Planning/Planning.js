import { useState, useEffect } from "react";
import { PlanningButton } from "./PlanningButton"
import NoSchedule from "../Schedule/NoSchedule";
import { Week } from "../Schedule/Week";
import { WeekHeader } from "../Schedule/WeekHeader";
import { isEvenWeek } from "../../Utils/handleTime";
import { useDispatch, useSelector } from "react-redux";
import { setParsedSchedule } from "../../ReduxStates/Slices/parsedScheduleSLice";
import { planningDataGETFetch } from "../../ReduxStates/Slices/planningDataSlice";
import { processPlanningQueue } from "../../FxFetches/Profile/processPlanningQueue";

export default function Planning() {
  const dispatch = useDispatch()

  const {groupNumber, groupId} = useSelector(s => s.groupNI);
  const { groupSchedule, groupScheduleStatus, groupScheduleError } = useSelector(s => s.groupSchedule);
  const {parsedSchedule1, parsedSchedule2} = useSelector(s => s.parsedSchedule);
  const {planningData, planningDataStatus, planningDataError} = useSelector(s => s.planningData);
  const {planningQueue, isProcessing} = useSelector(s => s.planningQueue);


  const [weekParity, setWeekParity] = useState(isEvenWeek(new Date));
  
  useEffect(() => {
    processPlanningQueue(dispatch, planningQueue, isProcessing);
  }, [dispatch, planningQueue, isProcessing]);

  useEffect(() => {
    dispatch(setParsedSchedule(groupSchedule));
  }, [dispatch, groupSchedule]);

  useEffect(() => {
    dispatch(planningDataGETFetch());
  }, [dispatch]);

  if (!groupSchedule) {
    return (
      <NoSchedule groupNumber={groupNumber} />
    )
  }
  
  if (!groupSchedule.is_ready) {
    return (
      <NoSchedule groupNumber={-1} />
    );
  }

  if (parsedSchedule1 && parsedSchedule2 && planningData) {
    return (
      <>  
      <div className='planning-header'>
        <PlanningButton
          parity={'1'}
          selectedParity={weekParity}
          text={'Первая неделя'}
          handleClick={() => setWeekParity('1')} />
        <PlanningButton
          parity={'2'}
          selectedParity={weekParity}
          text={'Вторая неделя'}
          handleClick={() => setWeekParity('2')} />
      </div>
      <div className="planning-thead">
        <div className="planning-thead__body">
          <div className="planning-thead__lesson">
            Предмет
          </div>
          <div className="planning-thead__attendance">
            Авто-посещение
          </div>
        </div>
      </div>
      
      <div className="under-planning-thead-box"></div>
  
      {weekParity === '1' ?
      <>
      <WeekHeader weekParity={weekParity} />
      <Week weekSchedule={parsedSchedule1} />
      </>
      :
      <>
      <WeekHeader weekParity={weekParity} />
      <Week weekSchedule={parsedSchedule2} />
      </>
      }
  
      <div className="under-planning-thead-box-mobile"></div>
      </>
    )
  }
}