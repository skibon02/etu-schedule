export interface ITextEditorProps {
  activeModal: 'none' | 'user' | 'group';
  setActiveModal: React.Dispatch<React.SetStateAction<'none' | 'user' | 'group'>>;
  text: string;
  setText: (value: string) => void;
  time_link_id: number;
}

export interface ITextEditorTemplateProps {
  inCSST: boolean;
  setActiveModal: React.Dispatch<React.SetStateAction<'none' | 'user' | 'group'>>;
  text: string;
  setText: (value: string) => void;
  bgColor: string;
  desc: string;
  disabledEditor: boolean;
  SETFetch: () => Promise<void>; 
  DELETEFetch: () => Promise<void>; 
}

