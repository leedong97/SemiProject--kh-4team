// 마이페이지 머리말: 제목 + 내 프로필 한 줄
// (메뉴·로그아웃은 공통 상단 메뉴가 맡아요)
function ProfileBanner({ user }) {
    return (
        <header className="mp-banner cmd-mp-head">
            <h1 className="mp-title">마이페이지</h1>

            <div className="mp-profile">
                <div className="mp-avatar" aria-hidden="true">
                    {user.name.charAt(0)}
                </div>
                <div className="mp-profile-text">
                    <p className="mp-name">
                        {user.name} <span>{user.rank}</span>
                    </p>
                    <p className="mp-sub">
                        {[user.division, user.team].filter(Boolean).join(" · ")}
                        {user.empNo && <> · <span className="cmd-num">{user.empNo}</span></>}
                        {user.role && <> · {user.role}</>}
                    </p>
                </div>
            </div>
        </header>
    );
}

export default ProfileBanner;
