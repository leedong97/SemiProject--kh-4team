import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import MainPage from './pages/MainPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        {/* 처음 접속하면 로그인 화면이 나온다 */}
        <Route path='/signup' element={<Signup/>}/>
        {/* signup 주소에서는 회원가입 화면을 보여준다 */}
        <Route path='/main' element={<MainPage/>}/>
        {/* 로그인 후 이동할 메인 페이지 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
