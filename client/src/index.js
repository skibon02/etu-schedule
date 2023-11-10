import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/style.css';
import App from './js/App/App';
// import App from './js/testRedux/App';
import reportWebVitals from './reportWebVitals';
import { backendHost } from './js/FxFetches/util';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
// import store from './js/testRedux/store'
import store from './js/ReduxStates/store'

// redirect to backend if we're on the authorize page
if (window.location.pathname === '/api/auth/redirect') {
    window.location.href = backendHost + '/api/auth/redirect' + window.location.search;
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  //   <Provider store={store}>
  //     <BrowserRouter>
  //       <App />
  //     </BrowserRouter>
  //   </Provider>
  // </React.StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
