import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/style.css';
import App from './js/Components/App';
import reportWebVitals from './reportWebVitals';
import {backendHost} from './js/functions/util'

// redirect to backend if we're on the authorize page
if (window.location.pathname === '/api/authorize') {
    window.location.href = backendHost + '/api/authorize';
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
  // <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
