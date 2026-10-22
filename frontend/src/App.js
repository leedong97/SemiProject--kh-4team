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
import Issue_detail from './pages/Issue_detail';

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
  const [issues, setIssues] = useState([
    {
      id: 1,
      projectId: "P001",
      title: "로그인 오류",
      description: "로그인 버튼 클릭 시 오류 발생",
      reporter: "홍길동",
      status: "접수",
      createdAt: "2026-10-22"
    }
  ]);
  const projects = [
    { id: "P001", name: "KB국민은행" },
    { id: "P002", name: "삼성전자" },
    { id: "P003", name: "쿠팡" },
    { id: "P004", name: "서울대학교병원" },
    { id: "P005", name: "대한항공" },
    { id: "P006", name: "현대자동차" },
    { id: "P007", name: "CJ대한통운" },
    { id: "P008", name: "신세계백화점" },
    { id: "P009", name: "한국전력공사" },
    { id: "P010", name: "서울특별시" }
  ];
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
            <Link to="/mypage">ㅇㅇㅇ님</Link>
          </h4>

          <div className='log'>
            <h4>로그아웃</h4>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home info={info} />} />
          <Route path="/mypage" element={<Mypage />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/info" element={<Info info={info} delInfo={delInfo} />} />
          <Route path='/info/set' element={<Info_set onAddInfo={addInfo} />} />
          <Route path='/info/:id' element={<Info_detail info={info} />} />
          <Route path="/issue" element={<Issue projects={projects} issues={issues} setIssues={setIssues} />} />
          <Route path="/issue/:id" element={<Issue_detail projects={projects} issues={issues}/>}/>
        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;