import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// BrowserRouter(주소 관리자)는 프로젝트 전체에서 딱 한 번, 여기에만 둡니다.
// 각자 폴더 안에서는 절대 BrowserRouter 를 또 만들지 마세요! (Router 안에 Router → 에러)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
