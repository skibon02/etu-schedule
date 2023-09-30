import { useState } from 'react';

export default function FeedbackForm() {

  function handleClick() {
    let name = prompt("your name: ");
    alert(`Hello, ${name}!`);
  }

  return (
    <button onClick={handleClick}>
      Greet
    </button>
  );
}
