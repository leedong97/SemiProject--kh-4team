import React from "react";
import { Link } from "react-router-dom";

// 커뮤니티 홈 머리말 (다른 목록 화면과 같은 머리말 형식)
function CommunityBanner() {
    return (
        <header className="community-banner cmd-page-head">
            <div>
                <h1 className="community-banner-title">커뮤니티</h1>
            </div>

            <Link to="/community/write/free" className="community-banner-link">
                글쓰기
            </Link>
        </header>
    );
}

export default CommunityBanner;
