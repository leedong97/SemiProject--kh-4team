import './App.css';
import Calendar from './function/Calendar';
import { useState } from 'react';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import Mypage from './pages/Mypage';
import Todo from './pages/Todo';
import Info from './pages/Info';
import Info_set from './pages/Info_set';
import Info_detail from './pages/Info_detail';
import Issue from './pages/Issue';
import Login from './pages/Login';
import Signup from './pages/Signup';
import user from './data/user';

function Home({ info }) {

  return (

    <>

      <Calendar />

      <div className='todo'>
        <h3>업무현황</h3>
        <ol>
          <li>OO회사 홈페이지 오류 건</li>
          <li>ㅁㅁ회사 ㅇㅇ기능 오류 건</li>
          <li>ㅂㅂ회사 ㄹㄹㄹ버그 제보 건</li>
        </ol>
      </div>

      <div className='info'>
        <h3>공지사항</h3>
        <ol>
          {
            [...info].reverse().slice(0, 3).map((item) => (
              <li key={item.id}>
                {item.title}
              </li>
            ))
          }
        </ol>
      </div>

    </>
  );
}

function App() {

  const [info, setInfo] = useState([]);

  const addInfo = (title, content) => {

    const newInfo = {
      id: Date.now(),
      title: title,
      content: content
    };

    setInfo(prev => [...prev, newInfo]);
  };

  const delInfo = (id) => {
    setInfo(prev => prev.filter(item => item.id !== id))
  }

  return (
    <BrowserRouter>
      <div>

        <div className='dash-menu'>
          <h3>
            <Link to="/">대시보드</Link>
          </h3>
        </div>

        <div className='todo-menu'>
          <h3>
            <Link to='/Todo'>업무현황</Link>
          </h3>
        </div>

        <div className='issue-menu'>
          <h3>
            <Link to='/Issue'>이슈관리</Link>
          </h3>
        </div>

        <div className='info-menu'>
          <h3>
            <Link to='/Info'>공지사항</Link>
          </h3>
        </div>

        <div className='my-name' tabIndex={0}>
          <h4>
            <Link to="/mypage">{user.name} {user.rank}</Link>
          </h4>

          <div className='log'>
            <h4><Link to="/login" style={{ display: "block", color: "inherit", textDecoration: "none" }}>로그아웃</Link></h4>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home info={info} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/info" element={<Info info={info} delInfo={delInfo} />} />
          <Route path='/info/set' element={<Info_set onAddInfo={addInfo} />} />
          <Route path='/info/:id' element={<Info_detail info={info} />} />
          <Route path='/issue' element={<Issue/>}/>
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;