import { planningDataSETFetch } from '../../ReduxStates/Slices/planningDataSlice';

function createQueueProcessor() {
  let isProcessing = false;
  const queue = [];

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) {
      return;
    }

    const nextRequest = queue.shift();
    
    isProcessing = true;
    await planningDataSETFetch(...nextRequest)
    isProcessing = false;

    processQueue(); 
  };

  const addToQueue = (request) => {
    queue.push(request);
    processQueue();
  };

  return addToQueue;
}

const addToQueue = createQueueProcessor();

export {addToQueue};