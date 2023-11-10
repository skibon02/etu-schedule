function handleNextWeek(setDate, date, weekNumber) {
  if (weekNumber < 17) {
    setDate(new Date(date.getTime() + 24 * 60 * 60 * 1000 * 7));
  }
}

function handleCurrentWeek(setDate) {
  setDate(new Date());
}

function handlePrevWeek(setDate, date, weekNumber) {
  if (weekNumber > 0) {
    setDate(new Date(date.getTime() - 24 * 60 * 60 * 1000 * 7));
  }
}



export {
  handleCurrentWeek, 
  handleNextWeek,  
  handlePrevWeek,
}