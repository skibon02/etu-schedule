import { useState, useEffect } from 'react';
import SEARCH from '../../icons/search.svg'

export default function Groups({setGroup, setActive, groupList}) {
  const [inputValue, setInputValue] = useState('');
  
  return (
    <div className='groups'>
      <div className='groups__input groups-input'>
        <input 
          className='groups-input__input'
          type="text"
          value={inputValue}
          placeholder='       Номер группы'
          onChange={(e) => setInputValue(e.target.value)}
        />
        {!inputValue && <img src={SEARCH} alt="" className='groups-input__icon'/>}
      </div>

      {!groupList && <span className='groups__loading'>Загрузка...</span>}

      {groupList && groupList
      .filter((group) => 
        group.number.indexOf(inputValue) === 0
      )
      .map((item) => (
        <div 
          className='groups__item'
          key={item.id}
          onClick={() => {
            setGroup(item.id);
            setActive('schedule');
          }}>
            {item.number}
        </div>
      ))}
    </div>
  );

}
