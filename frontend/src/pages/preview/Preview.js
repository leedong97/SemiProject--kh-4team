
import React from "react";
import "./Preview.css";

function Preview() {

    // 고객 확인용 임시 데이터
    const projects = [
        { id: 1, title: "ERP 시스템 개발" },
        { id: 2, title: "사내 인트라넷 개편" },
        { id: 3, title: "고객관리 시스템 구축" }
    ];

    const notices = [
        { id: 1, title: "시스템 정기 점검 안내" },
        { id: 2, title: "사내 보안 교육 안내" },
        { id: 3, title: "10월 정기 회의 안내" }
    ];

    // 실제 현재 월을 보여주는 캘린더
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const days = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: lastDate }, (_, i) => i + 1)
    ];

    return (
        <div className="preview-page">

            {/* 상단 메뉴 */}
            <header className="preview-header">

                <img
                    className="preview-logo"
                    src="/images/command-logo.png"
                    alt="COMMAND ERP"
                />

                <nav className="preview-nav">
                    <a href="#preview-dashboard">대시보드</a>
                    <a href="#preview-projects">프로젝트</a>
                    <a href="#preview-issues">이슈관리</a>
                    <a href="#preview-notices">공지사항</a>
                </nav>

                <span className="preview-user">데모 사용자</span>

            </header>

            <main className="preview-content" id="preview-dashboard">

                <div className="preview-heading">
                    <h1>대시보드</h1>
                    <p>COMMAND ERP 시스템 미리보기</p>
                </div>

                <div className="preview-grid">

                    <div className="preview-left">

                        {/* 캘린더 */}
                        <section className="preview-card">

                            <h2>캘린더</h2>

                            <h3 className="preview-month">
                                {year}년 {month + 1}월
                            </h3>

                            <div className="preview-calendar-grid">

                                {["일", "월", "화", "수", "목", "금", "토"].map(day => (
                                    <div className="preview-weekday" key={day}>
                                        {day}
                                    </div>
                                ))}

                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={
                                            day &&
                                                day === today.getDate()
                                                ? "preview-day today"
                                                : "preview-day"
                                        }
                                    >
                                        {day}
                                    </div>
                                ))}

                            </div>

                        </section>

                        {/* 이슈관리 */}
                        <section className="preview-card" id="preview-issues">
                            <h2>이슈관리</h2>

                            <div className="preview-list-item">
                                <span>로그인 화면 오류 수정</span>
                                <span className="preview-tag">진행중</span>
                            </div>

                            <div className="preview-list-item">
                                <span>데이터 조회 속도 개선</span>
                                <span className="preview-tag">검토 중</span>
                            </div>

                        </section>

                    </div>

                    <div className="preview-right">

                        {/* 공지사항 */}
                        <section className="preview-card" id="preview-notices">

                            <h2>공지사항</h2>

                            {notices.map((item, index) => (
                                <div className="preview-list-item" key={item.id}>
                                    <span>{index + 1}. {item.title}</span>
                                </div>
                            ))}

                        </section>

                        {/* 프로젝트 */}
                        <section className="preview-card" id="preview-projects">

                            <h2>프로젝트</h2>

                            {projects.map((item, index) => (
                                <div className="preview-list-item" key={item.id}>
                                    <span>{index + 1}. {item.title}</span>
                                </div>
                            ))}

                        </section>

                    </div>

                </div>

                <p className="preview-footer">
                    COMMAND ERP · 고객 확인용 데모 화면
                </p>

            </main>

        </div>
    );
}

export default Preview;
