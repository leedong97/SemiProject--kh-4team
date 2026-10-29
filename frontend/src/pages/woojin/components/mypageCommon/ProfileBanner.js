import { Link } from "react-router-dom";
import { clearLoginUser } from "../../getLoginUser";

// 프로필 상단 배너
function ProfileBanner({ user }) {
    return (
        <section className="mp-banner">
            <nav className="mp-nav">
                <Link to="/">대시보드</Link>
                <Link to="/Todo">업무현황</Link>
                <Link to="/Issue">이슈관리</Link>
                <Link to="/Info">공지사항</Link>
            </nav>
            <p className="mp-crumb">NEXUS ERP / 내 정보</p>
            <h1 className="mp-title">MY PAGE</h1>
            <div className="mp-profile">
                <div className="mp-avatar" aria-hidden="true">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <div className="mp-me" tabIndex={0}>
                        <p className="mp-name">
                            {user.name} <span>{user.rank} ▾</span>
                        </p>
                        <div className="mp-logout">
                            <h4><Link to="/login" onClick={clearLoginUser} style={{ display: "block", color: "inherit", textDecoration: "none" }}>로그아웃</Link></h4>
                        </div>
                    </div>
                    <p className="mp-sub">
                        {user.division} · {user.team}
                    </p>
                    <p className="mp-sub">
                        {user.empNo} · {user.role}
                    </p>
                </div>
            </div>
        </section>
    );
}

export default ProfileBanner;
