export interface IModalTemplateProps {
  showDecline?: boolean,
  titleText: string,
  confirmText: string,
  declineText: string,
  handleConfirm: () => void,
  handleDecline: () => void,
  inCSST: boolean,
}
