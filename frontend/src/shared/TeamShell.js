import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import getLoginUser from '../pages/woojin/getLoginUser';
import { API_BASE } from './config';
import './shell.css';

// 안 읽은 알림 수를 몇 ms마다 서버에 물어볼지 (3000 = 3초)
const NOTI_POLL_MS = 3000;

// 팀 공통 틀: 위쪽 메뉴바 + 아래 페이지가 들어갈 12칸 그리드
// (여기를 바꾸면 모두의 화면이 바뀌니, 바꾸기 전에 팀에 먼저 알려주세요)
function TeamShell() {
    // 마이페이지와 같은 출처: 로그인 정보가 있으면 진짜 직원, 없으면 shared/user.js 더미
    const user = getLoginUser();
    // 관리자 계정이면 관리자 화면(/admin)으로 돌아가는 메뉴를 보여줘요
    // 현재 주소에 맞는 메뉴에 'active'(파란 하이라이트)를 붙여요
    const path = useLocation().pathname.toLowerCase();
    const on = (prefix) => path === prefix || path.startsWith(prefix + '/');
    const isAdmin = !user.isDummy && user.role === '관리자';

    // 이름 옆에 보여줄 '안 읽은 알림 수' (더미 사용자는 서버에 직원이 없으니 묻지 않아요)
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        if (user.isDummy) return undefined;

        const load = () => {
            axios
                .get(`${API_BASE}/api/notifications`, { params: { employeeId: user.id } })
                .then((res) => setUnreadCount(res.data.unreadCount || 0))
                .catch(() => { }); // 실패해도 화면은 그대로 (다음 3초 뒤에 다시 시도)
        };

        load();
        const timerId = setInterval(load, NOTI_POLL_MS);
        return () => clearInterval(timerId); // 화면이 사라지면 타이머 정리
    }, [user.id, user.isDummy]);

    return (
        <div className="team-shell">

            <Link to="/" className="company-logo">
                <img
                    src="/images/command-logo.png"
                    alt="COMMAND ERP"
                />
            </Link>

            <div className={'dash-menu' + (path === '/' ? ' active' : '')}>
                <h3>
                    <Link to="/">대시보드</Link>
                </h3>
            </div>

            <div className={'todo-menu' + (on('/todo') ? ' active' : '')}>
                <h3>
                    <Link to='/todo'>프로젝트</Link>
                </h3>
            </div>

            <div className={'issue-menu' + (on('/issue') ? ' active' : '')}>
                <h3>
                    <Link to='/issue'>이슈관리</Link>
                </h3>
            </div>

            <div className={'info-menu' + (on('/info') ? ' active' : '')}>
                <h3>
                    <Link to='/info'>공지사항</Link>
                </h3>
            </div>

            <div className={'community-menu' + (on('/community') ? ' active' : '')}>
                <h3>
                    <Link
                        to="/community"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        커뮤니티
                    </Link>
                </h3>
            </div>

            <div className='my-name' tabIndex={0}>
                <h4>
                    <Link to="/mypage">
                        {user.name} {user.rank}
                        {unreadCount > 0 && (
                            <span className="noti-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </Link>
                </h4>

                <div className='log'>
                    {isAdmin && (
                        <h4><Link to="/admin" style={{ display: "block", color: "inherit", textDecoration: "none" }}>관리자 페이지</Link></h4>
                    )}
                    <h4><Link to="/login" style={{ display: "block", color: "inherit", textDecoration: "none" }}>로그아웃</Link></h4>
                </div>
            </div>

            {/* 각 사람의 페이지가 여기(그리드 안)에 들어와요 */}
            <Outlet />

        </div>
    );
}

export default TeamShell;
