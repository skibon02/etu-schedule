import { observer } from "mobx-react"
import { activeStore } from "../../stores/activeStore"

function Footer() {
  let footerClassName;
  let underFooterClassName;

  switch (activeStore.active) {
    case 'profile':
      footerClassName = 'footer-size footer';
      underFooterClassName = "footer-size under-footer-box";
      break;
    case 'schedule':
      footerClassName = "footer-size footer footer-schedule";
      underFooterClassName = "footer-size under-footer-box shcedule-footer-box";
      break;
    case 'planning':
      footerClassName = "footer-size footer footer-planning";
      underFooterClassName = "footer-size under-footer-box planning-footer-box";
      break;
    default:
      break;
  }

  return (
    <>
    <div className={footerClassName}>
      <div className="footer__message">Посетите наш репозиторий:</div>
      <a target="_blank" href="https://github.com/skibon02/etu-schedule" className="footer__link">https://github.com/skibon02/etu-schedule</a>
    </div>
    <div className={underFooterClassName}></div>
    </>
  )
}

export default observer(Footer);
