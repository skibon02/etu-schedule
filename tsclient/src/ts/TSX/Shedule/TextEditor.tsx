import React, { useEffect, useRef, useState } from "react";
import QuillEditor from "./QuillEditor";
import { CSSTransition } from "react-transition-group";
import { userDataStore } from "../../stores/userDataStore";
import { observer } from "mobx-react";
import { ITextEditorProps, ITextEditorTemplateProps } from "../../types/tsx/Schedule/TextEditorTypes";
import { GroupDateTokenService } from "../../services/GroupDateTokenService";

function TextEditorTemplate({disabledEditor, inCSST, setActiveModal, text, setText, bgColor, desc, SETFetch, DELETEFetch}: ITextEditorTemplateProps) {
  const [textCache, setTextCache] = useState(text);

  const handleDecline = (e: any, textCache: string) => {
    e.stopPropagation();
    setText(textCache);
    setActiveModal('none');
  }

  const handleConfirm = async (e: any, text: string) => {
    e.stopPropagation();
    setActiveModal('none');
    setTextCache(text);
    if (text === '<p><br></p>') {
      await DELETEFetch();
    } else {
      console.log('i want to call set fetch from text editor with', desc);
      await SETFetch();
    }
  }

  const textCacheRef = useRef(textCache);
  const textRef = useRef(text);

  useEffect(() => {
    textCacheRef.current = textCache;
    textRef.current = text;
  }, [textCache, text]);

  useEffect(() => {
    if (!inCSST) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      if (!(target.closest('.lesson__user-note') || target.closest('.lesson__group-note')) || target.classList.contains('lesson__note-editor-button-decline')) {
        handleDecline(e, textCacheRef.current);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDecline(e, textCacheRef.current);
        e.stopPropagation();
      }
    }

    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [inCSST]);

  return (
    <CSSTransition in={inCSST} timeout={150} classNames={'editor-transition'} unmountOnExit>
      <div className="editor-transition">
        <div className="lesson__note-editor" >
          <div className="lesson__note-editor-description">Заметка {desc === 'user' ? 'пользователя' : 'группы'}</div>
          <QuillEditor disabledEditor={disabledEditor} text={text} setText={setText} bgColor={bgColor} />
          <div className="lesson__note-editor-buttons">
            {(desc === 'user' || desc === 'group' && !disabledEditor) &&
            <>
            <div className="lesson__note-editor-button-decline lesson__note-editor-button" onClick={(e) => handleDecline(e, textCache)}>Отмена</div>
            <div className="lesson__note-editor-button-confirm lesson__note-editor-button" onClick={(e) => handleConfirm(e, text)}>Сохранить</div>
            </>
            }
          </div>
        </div>
      </div>
    </CSSTransition>
  )
}

function UserEditor({time_link_id, activeModal, text, setText, setActiveModal}: ITextEditorProps) {
  const userSETFetch = async () => {
    await GroupDateTokenService.userNoteSETFetch(time_link_id, text);
  }

  const userDELETEFetch = async () => {
    await GroupDateTokenService.userNoteDELETEFetch(time_link_id);
  }

  return (
    <TextEditorTemplate disabledEditor={false} inCSST={activeModal === 'user'} setActiveModal={setActiveModal} text={text} setText={setText} SETFetch={userSETFetch} DELETEFetch={userDELETEFetch} bgColor="52e6c1" desc="user" />
  )
}

function GroupEditor({time_link_id, activeModal, text, setText, setActiveModal}: ITextEditorProps) {
  const groupSETFetch = async () => {
    await GroupDateTokenService.groupNoteSETFetch(time_link_id, text);
  }

  const groupDELETEFetch = async () => {
    await GroupDateTokenService.groupNoteDELETEFetch(time_link_id);
  }

  return (
    <TextEditorTemplate disabledEditor={!userDataStore.leaderForGroup} inCSST={activeModal === 'group'} setActiveModal={setActiveModal} text={text} setText={setText} SETFetch={groupSETFetch} DELETEFetch={groupDELETEFetch} bgColor="f69267" desc="group" />
  )
}

const ObsUserEditor = observer(UserEditor);
const ObsGroupEditor = observer(GroupEditor);

export {
  ObsUserEditor,
  ObsGroupEditor
}
