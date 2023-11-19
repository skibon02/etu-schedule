import {planningQueueREMOVE, isProcessingFalse, isProcessingTrue} from '../../ReduxStates/Slices/planningQueueSlice'
import { planningDataSETFetch } from '../../ReduxStates/Slices/planningDataSlice';

export async function processPlanningQueue(dispatch, planningQueue, isProcessing) {
  if (!isProcessing && planningQueue.length > 0) {
    const item = planningQueue[0];
    console.log('started processing planning, left in queue: ', planningQueue.length);
    dispatch(isProcessingTrue());

    await planningDataSETFetch(...item);
    dispatch(isProcessingFalse());
    console.log('finished processing planning, left in queue: ', planningQueue.length);
    dispatch(planningQueueREMOVE());
  } else {
    console.log('i will not start, untill prev is pending or queue is empty, isPending:', isProcessing);
    console.log('queue:', Array.of(planningQueue));
  }
}
