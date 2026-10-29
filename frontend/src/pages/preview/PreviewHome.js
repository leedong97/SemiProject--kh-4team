import React, { useState } from "react";
import { Link } from "react-router-dom";

const notices = [
    { id: 1, title: "COMMAND ERP 데모 이용 안내", date: "01일", pinned: true },
    { id: 2, title: "프로젝트 진행 현황 업데이트 안내", date: "08일" },
    { id: 3, title: "정기 시스템 점검 안내", date: "15일" },
    { id: 4, title: "월말 업무 보고 일정 안내", date: "23일" },
];

const projects = [
    { id: 1, title: "모바일 근태관리 시스템", progress: 65, status: "진행 중" },
    { id: 2, title: "고객 문의 통합 관리", progress: 40, status: "진행 중" },
    { id: 3, title: "사내 포털 개편", progress: 100, status: "완료" },
];

const pad = (value) => String(value).padStart(2, "0");

const dateKey = (year, month, day) =>
    `${year}-${pad(month + 1)}-${pad(day)}`;

function PreviewHome() {
    const [today] = useState(() => new Date());

    const [viewMonth, setViewMonth] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const [selectedDate, setSelectedDate] = useState(() =>
        dateKey(today.getFullYear(), today.getMonth(), today.getDate())
    );

    // 샘플 일정은 처음 페이지를 연 달에 배치됩니다.
    const [events] = useState(() => {
        const year = today.getFullYear();
        const month = today.getMonth();

        return [
            {
                id: 1,
                date: dateKey(year, month, 5),
                time: "10:00",
                title: "팀 주간 회의",
            },
            {
                id: 2,
                date: dateKey(year, month, 12),
                time: "14:00",
                title: "프로젝트 중간 점검",
            },
            {
                id: 3,
                date: dateKey(year, month, 20),
                time: "11:00",
                title: "신규 기능 시연",
            },
            {
                id: 4,
                date: dateKey(year, month, today.getDate()),
                time: "16:00",
                title: "데모 서비스 체험",
            },
            {
                id: 5,
                date: dateKey(year, month, 28),
                time: "15:00",
                title: "월말 업무 보고",
            },
        ];
    });

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const cellCount = Math.ceil((firstWeekday + lastDay) / 7) * 7;

    const todayKey = dateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    const selectedEvents = events
        .filter((event) => event.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    function changeMonth(offset) {
        const next = new Date(year, month + offset, 1);
        setViewMonth(next);
        setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1));
    }

    function goToToday() {
        setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(todayKey);
    }

    return (
        <>
            <div className="preview-heading">
                <h1>대시보드</h1>
                <p>COMMAND ERP 시스템 미리보기 · 아래 내용은 샘플 데이터입니다.</p>
            </div>

            <div className="preview-grid">
                <section className="preview-card">
                    <h2>캘린더</h2>

                    <div className="demo-calendar-toolbar">
                        <div className="demo-month-controls">
                            <button
                                type="button"
                                aria-label="이전 달"
                                onClick={() => changeMonth(-1)}
                            >
                                ‹
                            </button>

                            <strong aria-live="polite">
                                {year}년 {month + 1}월
                            </strong>

                            <button
                                type="button"
                                aria-label="다음 달"
                                onClick={() => changeMonth(1)}
                            >
                                ›
                            </button>
                        </div>

                        <button
                            type="button"
                            className="demo-today-button"
                            onClick={goToToday}
                        >
                            오늘
                        </button>
                    </div>

                    <div
                        className="demo-calendar-grid"
                        role="group"
                        aria-label={`${year}년 ${month + 1}월 날짜 선택`}
                    >
                        {["일", "월", "화", "수", "목", "금", "토"].map(
                            (weekday, index) => (
                                <div
                                    key={weekday}
                                    className={`demo-weekday ${index === 0 ? "is-sunday" : ""
                                        }`}
                                >
                                    {weekday}
                                </div>
                            )
                        )}

                        {Array.from({ length: cellCount }, (_, index) => {
                            const day = index - firstWeekday + 1;

                            if (day < 1 || day > lastDay) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="demo-calendar-empty"
                                        aria-hidden="true"
                                    />
                                );
                            }

                            const key = dateKey(year, month, day);
                            const count = events.filter(
                                (event) => event.date === key
                            ).length;

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={[
                                        "demo-calendar-day",
                                        index % 7 === 0 ? "is-sunday" : "",
                                        key === todayKey ? "is-today" : "",
                                        key === selectedDate ? "is-selected" : "",
                                    ].join(" ")}
                                    aria-label={`${month + 1}월 ${day}일, 일정 ${count}개`}
                                    aria-pressed={key === selectedDate}
                                    aria-current={key === todayKey ? "date" : undefined}
                                    onClick={() => setSelectedDate(key)}
                                >
                                    <span>{day}</span>
                                    {count > 0 && (
                                        <span className="demo-event-dot" aria-hidden="true" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="demo-day-schedule" aria-live="polite">
                        <h3>
                            {Number(selectedDate.slice(5, 7))}월{" "}
                            {Number(selectedDate.slice(8, 10))}일 일정
                        </h3>

                        {selectedEvents.length > 0 ? (
                            <ul className="demo-schedule-list">
                                {selectedEvents.map((event) => (
                                    <li key={event.id}>
                                        <time dateTime={`${event.date}T${event.time}`}>
                                            {event.time}
                                        </time>
                                        <span>{event.title}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="demo-empty-message">
                                등록된 샘플 일정이 없습니다.
                            </p>
                        )}
                    </div>
                </section>

                <div className="preview-right">
                    <section className="preview-card">
                        <h2>공지사항</h2>

                        <ul className="demo-notice-list">
                            {notices.map((notice) => (
                                <li key={notice.id}>
                                    <div className="demo-notice-title">
                                        {notice.pinned && (
                                            <span className="demo-notice-badge">안내</span>
                                        )}
                                        <span>{notice.title}</span>
                                    </div>
                                    <span className="demo-notice-date">
                                        {today.getMonth() + 1}월 {notice.date}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Link className="demo-more-link" to="/preview/notices">
                            공지사항 전체 보기 →
                        </Link>
                    </section>

                    <section className="preview-card">
                        <h2>프로젝트</h2>

                        <ul className="demo-notice-list">
                            {projects.map((project) => (
                                <li key={project.id}>
                                    <div className="demo-notice-title">
                                        <span>{project.title}</span>
                                    </div>

                                    <span className="demo-notice-date">
                                        {project.status}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <Link className="demo-more-link" to="/preview/projects">
                            프로젝트 전체 보기 →
                        </Link>
                    </section>
                </div>
            </div>
        </>
    );
}

export default PreviewHome;