import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import getLoginUser, { clearLoginUser } from '../pages/woojin/getLoginUser';
import { API_BASE } from './config';
import './theme.css';
import './components.css';
import './shell.css';
import './pages.css';
import './mypage.css';
import zerynMark from '../assets/zeryn-logo-light.png';

// 안 읽은 알림 수를 몇 ms마다 서버에 물어볼지 (10000 = 10초)
const NOTI_POLL_MS = 10000;

// 상단 메뉴 목록 (주소, 이름)
const MENUS = [
  { to: '/', label: '대시보드', end: true },
  { to: '/todo', label: '프로젝트' },
  { to: '/issue', label: '이슈관리' },
  { to: '/info', label: '공지사항' },
  { to: '/community', label: '커뮤니티' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

// 팀 공통 틀: 위쪽 메뉴바 + 아래에 각 페이지가 들어가요
// (여기를 바꾸면 모두의 화면이 바뀌니, 바꾸기 전에 팀에 먼저 알려주세요)
function TeamShell() {
  // 로그인 정보가 있으면 진짜 직원, 없으면 shared/user.js 더미
  const user = getLoginUser();
  const isAdmin = !user.isDummy && user.role === '관리자';
  const { pathname } = useLocation();

  // 안 읽은 알림 수 (더미 사용자는 서버에 묻지 않아요)
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (user.isDummy) return undefined;

    const load = () => {
      axios
        .get(`${API_BASE}/api/notifications`, { params: { employeeId: user.id } })
        .then((res) => setUnreadCount(res.data.unreadCount || 0))
        .catch(() => {}); // 실패해도 화면은 그대로 (다음 주기에 다시 시도)
    };

    load();
    const timerId = setInterval(load, NOTI_POLL_MS);
    return () => clearInterval(timerId);
  }, [user.id, user.isDummy]);

  // 계정 메뉴 열림/닫힘
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const unreadText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="team-shell cmd-shell">
      <a className="cmd-skip" href="#cmd-main">본문으로 건너뛰기</a>

      <header className="cmd-header">
        <div className="cmd-header-inner">
          <Link to="/" className="cmd-logo" aria-label="ZERYN 대시보드">
            <img className="cmd-logo-img" src={zerynMark} alt="" aria-hidden="true" />
          </Link>

          <nav className="cmd-nav" aria-label="주 메뉴">
            <ul>
              {MENUS.map((m) => (
                <li key={m.to}>
                  <NavLink to={m.to} end={m.end}>
                    {m.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="cmd-header-meta">
            <span className="cmd-date">{todayLabel()}</span>

            <Link
              to="/mypage?tab=noti"
              className="cmd-noti"
              aria-label={unreadCount > 0 ? `읽지 않은 알림 ${unreadText}개` : '알림'}
            >
              알림
              {unreadCount > 0 && <span className="cmd-noti-count" aria-hidden="true">{unreadText}</span>}
            </Link>

            <div className="cmd-account" ref={accountRef}>
              <button
                type="button"
                className="cmd-account-trigger"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-controls="cmd-account-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="cmd-account-name">{user.name}</span>
                <span className="cmd-account-rank">{user.rank}</span>
                <svg className="cmd-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>

              {menuOpen && (
                <div className="cmd-account-menu" id="cmd-account-menu">
                  <p className="cmd-account-team">{[user.division, user.team].filter(Boolean).join(' · ') || '소속 정보 없음'}</p>
                  <Link to="/mypage">마이페이지</Link>
                  {isAdmin && <Link to="/admin">관리자 페이지</Link>}
                  <Link
                    to="/login"
                    onClick={() => {
                      clearLoginUser();
                      sessionStorage.removeItem('nexus_token'); // 관리자 인증 토큰도 정리
                    }}
                    className="cmd-logout"
                  >
                    로그아웃
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 각 사람의 페이지가 여기에 들어와요 */}
      <main id="cmd-main" className="cmd-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

export default TeamShell;
