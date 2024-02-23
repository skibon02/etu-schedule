import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = ({disabledEditor, text, setText, bgColor}: {disabledEditor: boolean, text: string, setText: (text: string) => void, bgColor: string}) => {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const length = editor.getLength(); 
      editor.setSelection(length, 0); 
    }
  }, []);

  const modules = {
    toolbar: [
      // ['bold', 'italic', 'underline', 'strike'], // жирный, курсив, подчеркивание, зачеркивание
      ['bold', 'italic', 'underline'], // жирный, курсив, подчеркивание, зачеркивание
      [{'list': 'ordered'}], // списки
      // [{'list': 'ordered'}, {'list': 'bullet'}], // списки
      // [{'size': ['small', false, 'large']}], // размер шрифта
    ],
  };

  return (
    <ReactQuill
      ref={quillRef}
      readOnly={disabledEditor}
      style={{
        // height: '100%', 
        // width: '100%',
        borderRadius: '5px',
        backgroundColor: bgColor,
    }} value={text} onChange={setText} modules={modules} />
  );
};

export default QuillEditor;
