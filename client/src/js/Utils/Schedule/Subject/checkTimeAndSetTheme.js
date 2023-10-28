export function checkTimeAndSetTheme(checkInDeadline) {
  const currentTime = new Date();
  let isLate = false;
  if (currentTime > checkInDeadline) {   
    isLate = true;
  } 
  return isLate;
};