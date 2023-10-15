import { useState, useEffect, useRef } from 'react';
import SEARCH from '../../icons/search.svg'

export default function Groups({setGroup, setActive, groupList, setGroupNumber}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);
  
  return (
    <div className='groups'>
      <div className='groups__input-container'>
        <div className='groups__input groups-input'>
          <input 
            ref={inputRef}
            className='groups-input__input'
            type="text"
            value={inputValue}
            placeholder='       Номер группы'
            onChange={(e) => setInputValue(e.target.value)}
          />
          {!inputValue && <img src={SEARCH} alt="" className='groups-input__icon'/>}
        </div>
      </div>

      {!groupList && <span className='groups__loading'>Загрузка...</span>}

      <div className='groups__items'>
        {groupList && groupList
        .filter((group) => 
          group.number.indexOf(inputValue) === 0
        )
        .map((group) => (
          <div 
            className='groups__item'
            key={group.id}
            onClick={() => {
              setGroup(group.id);
              setGroupNumber(group.number);
              setActive('schedule');
            }}>
              {group.number}
          </div>
        ))}
      </div>
    </div>
  );

}
