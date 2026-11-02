import { Link } from "react-router-dom";
import { clearLoginUser } from "../../getLoginUser";

function ProfileBanner({ user }) {
    return (
        <section className="mp-banner">
            <nav className="mp-nav">
                <Link to="/">대시보드</Link>
                <Link to="/Todo">업무현황</Link>
                <Link to="/Issue">이슈관리</Link>
                <Link to="/Info">공지사항</Link>
                {/* 관리자 계정만: 관리자 화면(/admin)으로 돌아가는 링크 */}
                {!user.isDummy && user.role === "관리자" && <Link to="/admin">관리자 페이지</Link>}
            </nav>
            <p className="mp-crumb">COMMAND ERP / 내 정보</p>
            <h1 className="mp-title">MY PAGE</h1>
            <div className="mp-profile">
                <div className="mp-avatar" aria-hidden="true">
                    {user.name.charAt(0)}
                </div>
                <div>
                    {/* 이름에 마우스를 올리면(또는 클릭하면) 로그아웃이 나와요 */}
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
