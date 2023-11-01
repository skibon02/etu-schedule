export default function NoSchedule({groupNumber}) {
  return (
    <div className="no-schedule">
      {!groupNumber && <div className="no-schedule__text">Выбери группу во вкладке "Группы"</div>}
      {groupNumber && <div className="no-schedule__text">Загрузка...</div>}
    </div>
  )
}