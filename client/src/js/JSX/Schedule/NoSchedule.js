export default function NoSchedule({groupNumber, groupNILoading}) {
  if (groupNumber === -1) {
    return <div className="no-schedule"><div className="no-schedule__text">Выполняются работы на сервере. Попробуйте перезагрузить страницу немного позже.</div></div>
  } else if (!groupNumber && !groupNILoading) {
    return <div className="no-schedule"><div className="no-schedule__text">Выберите постоянную группу в профиле.</div></div>
  } else {
    return <div className="no-schedule"><div className="no-schedule__text">Загрузка...</div></div>
  }
}
