import { useState, useEffect, useRef } from 'react';
// import SEARCH from '../../../icons/search.svg'
import SEARCH from '../../../icons/search_2.svg'
import * as handlers from '../../Handlers/Groups/handlers'
import React from 'react';
import { useNavigate } from 'react-router-dom'

export default function Groups({setGroupId, setActive, groupList, setGroupNumber, setGroupSchedule}) {
  const [inputValue, setInputValue] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current.focus();
  }, []);
  
  return (
    <div className='groups'>
      <div className='groups__input-container groups__input-container_header'>
        <div className='groups__input groups-input'>
          <input 
            ref={inputRef}
            className='groups-input__input'
            type="text"
            value={inputValue}
            placeholder='       Номер группы'
            onChange={(e) => handlers.onInputChange(setInputValue, e.target.value)}
          />
          {!inputValue && <img src={SEARCH} alt="" className='groups-input__icon'/>}
            <>
            <div className='groups__checkbox-container'>
              <label className='groups__checkbox-label'>
                <input type="checkbox" className='groups__checkbox' checked={isChecked} onChange={() => setIsChecked(!isChecked)} /> {' '} 
                <span className="groups__checkbox-description">запомнить мой выбор</span>
              </label>
            </div>
            </>
        </div>
      </div>
      <div className='groups__under-checkbox-box'></div>
      {!groupList && <span className='groups__loading groups__loading_header'>Загрузка...</span>}
      
      <div className='groups__items groups__items_header'>
        {groupList && groupList
        .filter((group) => 
          group.number.indexOf(inputValue) === 0
        )
        .map((group) => (
          <div 
            className='groups__item'
            key={group.id}
            onClick={() => {
              handlers.onGroupClick(
                setGroupId,
                setGroupNumber,
                setActive,
                group.id,
                group.number,
                setGroupSchedule, 
                isChecked
                );
                navigate('/schedule')
            }}>
              {group.number}
          </div>
        ))}
      </div>
    </div>
  );

}
