import React from "react";
import { Link } from "react-router-dom";
import "./CommunityBanner.css";

function CommunityBanner() {
    return (
        <section className="community-banner">
            {/* 왼쪽: 문구와 버튼을 하나로 묶기 */}
            <div className="community-banner-content">
                <span className="community-banner-label">
                    BETTER TOGETHER
                </span>

                <h2 className="community-banner-title">
                    일하는 이야기 너머,
                    <br />
                    우리의 이야기가 모이는 곳.
                </h2>

                <p className="community-banner-description">
                    작은 질문도, 새로운 아이디어도 편하게 나눠보세요.
                </p>

                <Link
                    to="/community/board/free"
                    className="community-banner-link"
                >
                    동료들의 이야기 둘러보기 ↗
                </Link>
            </div>

            {/* 오른쪽: 말풍선 장식 */}
            <div className="community-banner-art" aria-hidden="true">
                <span className="community-banner-sparkle">
                    ✧
                </span>

                <div className="community-banner-bubble-white">
                    <span />
                    <span />
                    <span />
                </div>

                <div className="community-banner-bubble-blue">
                    함께 ✦
                </div>
            </div>
        </section>
    );
}

export default CommunityBanner;