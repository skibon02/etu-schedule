import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { decrement } from "./counterSlice";
import { fetchGroups, resetGroupList } from "./groupList";

export default function App() {
  const [counter, setCounter] = useState(0);
  const { groupList, status, error } = useSelector((s) => s.groupList);

  const rCounter = useSelector(s => s.counter);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchGroups());
    console.log('groupList:');
    console.log(groupList);
  }, [dispatch, rCounter]);

  return (
    <div>
      <div>
        {rCounter} <br />
        <button onClick={() => dispatch(decrement())}>--</button>
      </div>
      {/* {groupList} */}
      <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
      <Child counter={counter} setCounter={setCounter} />
    </div>
  )
}

function Child({counter, setCounter}) {
  const rCounter = useSelector(s => s.counter)
  const { groupList, status, error } = useSelector((s) => s.groupList);
  const dispatch = useDispatch();


  return (
    <>
    <div>
      {rCounter}
    </div>
    <div>
      {counter}
      <br />
      <button onClick={() => {
        setCounter(counter + 1);
        dispatch(resetGroupList());
        console.log('groupList after reset:');
        console.log(groupList);
        }}>++</button>
    </div>
    </>
  )
}
