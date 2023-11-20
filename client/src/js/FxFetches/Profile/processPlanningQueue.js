import { planningDataSETFetch } from '../../ReduxStates/Slices/planningDataSlice';

function createQueueProcessor() {
  let isProcessing = false;
  const queue = [];

  const processQueue = async (dispatch) => {
    if (isProcessing || queue.length === 0) {
      return;
    }

    const nextRequest = queue.shift();
    
    isProcessing = true;
    await planningDataSETFetch(dispatch, ...nextRequest)
    isProcessing = false;

    processQueue(dispatch); 
  };

  const addToQueue = (dispatch, request) => {
    queue.push(request);
    processQueue(dispatch);
  };

  return addToQueue;
}

const addToQueue = createQueueProcessor();

export {addToQueue};