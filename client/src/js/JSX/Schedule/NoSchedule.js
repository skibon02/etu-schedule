export default function NoSchedule({groupNumber}) {
  return (
    <div className="no-schedule">
      {!groupNumber && <div className="no-schedule__text">Выберите постоянную группу в профиле.</div>}
      {groupNumber && <div className="no-schedule__text">Загрузка...</div>}
    </div>
  )
}