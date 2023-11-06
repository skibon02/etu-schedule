export default function NoSchedule({groupNumber}) {
  return (
    <div className="no-schedule">
      {groupNumber === -1 && <div className="no-schedule__text">Выполняются работы на сервере. Попробуйте перезагрузить страницу немного позже.</div>}
      {!groupNumber && groupNumber !== -1 && <div className="no-schedule__text">Выберите постоянную группу в профиле.</div>}
      {groupNumber && groupNumber !== -1 && <div className="no-schedule__text">Загрузка...</div>}
    </div>
  )
}