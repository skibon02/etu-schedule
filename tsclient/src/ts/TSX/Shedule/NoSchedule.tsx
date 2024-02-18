function NoSchedule({description}: {description: "serverError" | "noGroupChosen" | "loading" | "unknownError"}) {
  if (description === 'serverError') {
    return <Text text="Выполняются работы на сервере. Попробуйте перезагрузить страницу немного позже." />
  } else if (description === 'noGroupChosen') {
    return <Text text="Выберите постоянную группу в профиле." />
  } else if (description === 'loading') {
    return  <Text text="Загрузка..." />
  } else if (description === 'unknownError') {
    return <Text text="Кажется, произошла неизвестная ошибка. Попробуйте перезагрузить страницу." />
  } else {
    return <Text text="..." />
  }
}

function Text({text}: {text: string}) {
  return (
    <div className="no-schedule">
      <div className="no-schedule__text">
        {text}
      </div>
    </div>
  )
}

export default NoSchedule;
