import { Link, Outlet } from 'react-router-dom';
import user from './user';
import './shell.css';

// 팀 공통 틀: 위쪽 메뉴바 + 아래 페이지가 들어갈 12칸 그리드
// (여기를 바꾸면 모두의 화면이 바뀌니, 바꾸기 전에 팀에 먼저 알려주세요)
function TeamShell() {
  return (
    <div className="team-shell">

      <Link to="/" className="company-logo">
        <img
          src="/images/command-logo.png"
          alt="COMMAND ERP"
        />
      </Link>

      <div className='dash-menu'>
        <h3>
          <Link to="/">대시보드</Link>
        </h3>
      </div>

      <div className='todo-menu'>
        <h3>
          <Link to='/todo'>프로젝트</Link>
        </h3>
      </div>

      <div className='issue-menu'>
        <h3>
          <Link to='/issue'>이슈관리</Link>
        </h3>
      </div>

      <div className='info-menu'>
        <h3>
          <Link to='/info'>공지사항</Link>
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

      {/* 각 사람의 페이지가 여기(그리드 안)에 들어와요 */}
      <Outlet />

    </div>
  );
}

export default TeamShell;
