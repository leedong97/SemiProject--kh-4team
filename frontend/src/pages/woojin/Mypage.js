import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import user from "../../shared/user";
import "./Mypage.css";

/* ---------------------------------------------------------
   1) 더미 데이터 (나중에 서버에서 받아온 값으로 교체할 자리)
--------------------------------------------------------- */

const projects = [
    { id: 1, name: "KB국민은행 고객정보 통합관리", role: "백엔드 개발 담당", progress: 65 },
    { id: 2, name: "삼성전자 생산·재고관리 시스템", role: "API 개발 지원", progress: 30 },
];

const tasks = [
    { id: 1, title: "고객정보 등록 API 개발", status: "진행 중" },
    { id: 2, title: "고객정보 테이블 설계", status: "완료" },
    { id: 3, title: "프로젝트 QA 테스트", status: "대기" },
];

// start ~ end : 시작일 ~ 종료일 (하루짜리 일정은 start 와 end 가 같아요)
// 휴가·프로젝트나 여러 날짜에 걸친 일정은 달력에 "막대"로 이어져 보여요
const initialSchedules = [
    { id: 1, start: "2026-10-22", end: "2026-10-22", title: "ERP 개발팀 주간 회의", time: "10:00", type: "업무" },
    { id: 2, start: "2026-10-22", end: "2026-10-22", title: "개인 학습 및 코드 리뷰", time: "19:00", type: "개인" },
    { id: 3, start: "2026-10-25", end: "2026-10-25", title: "프로젝트 중간 점검", time: "14:00", type: "업무" },
    { id: 4, start: "2026-10-28", end: "2026-10-28", title: "QA 테스트 준비", time: "11:00", type: "업무" },
    { id: 6, start: "2026-10-05", end: "2026-11-27", title: "KB국민은행 통합관리", time: "", type: "프로젝트" },
    { id: 7, start: "2026-10-19", end: "2026-12-18", title: "삼성전자 생산·재고관리", time: "", type: "프로젝트" },
];

// 이번 주 근무 시간 (시간 단위)
const weekHours = [
    { day: "월", hours: 8.5 },
    { day: "화", hours: 9 },
    { day: "수", hours: 8 },
    { day: "목", hours: 9.5 },
    { day: "금", hours: 7.5 },
];
const MAX_HOURS = 10; // 막대 그래프에서 100% 높이로 보는 기준

// 연차
const LEAVE_TOTAL = 15;
const leaveHistory = [
    { id: 1, date: "2026-10-02", type: "반차", days: 0.5 },
    { id: 2, date: "2026-09-14", type: "반차", days: 0.5 },
    { id: 3, date: "2026-10-12", type: "연차", days: 3 },
    { id: 4, date: "2026-07-17", type: "연차", days: 1 },
    { id: 5, date: "2026-05-05", type: "연차", days: 1 },
    { id: 6, date: "2026-02-09", type: "연차", days: 1 },
];

// 내가 등록한 이슈·공지
const myIssues = [
    { id: 1, title: "로그인 화면 오류 제보", status: "진행 중", date: "2026-10-19" },
    { id: 2, title: "회원가입 비밀번호 검증 누락", status: "완료", date: "2026-10-15" },
];
const myNotices = [{ id: 1, title: "11월 정기 보안 교육 안내", date: "2026-10-20" }];

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TABS = ["일정 관리", "내 업무", "근태·휴가", "내 활동", "내 정보"];
const TYPES = ["개인", "업무", "휴가", "프로젝트"];
const FILTERS = ["전체", ...TYPES];
// 일정 종류 → CSS 클래스 이름
const TYPE_CLASS = { 업무: "work", 개인: "personal", 휴가: "leave", 프로젝트: "project" };
const EMPTY_PW = { current: "", next: "", confirm: "" };
const makeEmptyForm = (key) => ({ title: "", start: key, end: key, time: "09:00", type: "개인" });
const MIN_PW_LENGTH = 8; // 예시 값: 실제 비밀번호 규칙은 팀과 정해야 해요

/* ---------------------------------------------------------
   2) 날짜를 "2026-10-22" 형태의 문자열로 바꿔 주는 도우미 함수
      (월은 0~11 이라서 +1 해 줘야 해요)
--------------------------------------------------------- */
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// "막대"로 그릴 일정인가? (휴가·프로젝트이거나, 여러 날짜에 걸친 일정)
const isPeriod = (s) => s.type === "휴가" || s.type === "프로젝트" || s.start !== s.end;

// 프로젝트는 몇 달씩 이어져서 달력 막대로 그리면 너무 길어요 → 달력 위쪽 "진행 중인 프로젝트" 띠로 따로 보여 줘요
const isProject = (s) => s.type === "프로젝트";

// 시작일~종료일이 며칠인지 (둘 다 포함해서 센다: 10/12~10/14 = 3일)
const countDays = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000) + 1;

function Mypage() {
    const today = new Date();
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    const [tab, setTab] = useState("일정 관리");
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0 = 1월
    const [selectedKey, setSelectedKey] = useState(todayKey);
    const [schedules, setSchedules] = useState(initialSchedules);
    const [filter, setFilter] = useState("전체");

    const [showForm, setShowForm] = useState(false);
    const formRef = useRef(null); // 수정 폼이 화면 아래에 열려도 자동으로 보이게 하려고 사용
    const [editingId, setEditingId] = useState(null); // null 이면 "새로 등록", 숫자면 "그 일정 수정"
    const [form, setForm] = useState(makeEmptyForm(todayKey));
    const [error, setError] = useState("");

    const [pw, setPw] = useState(EMPTY_PW);
    const [pwMsg, setPwMsg] = useState(null); // { type: "ok" | "error", text }

    /* ---------- 달력 계산 ---------- */
    const firstDay = new Date(year, month, 1).getDay(); // 1일의 요일 (0=일)
    const lastDate = new Date(year, month + 1, 0).getDate(); // 이번 달 마지막 날

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // 앞쪽 빈칸
    for (let d = 1; d <= lastDate; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null); // 뒤쪽 빈칸도 채워서 7의 배수로

    // 7칸씩 잘라서 "주(週)" 배열로 만들기
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const prevMonth = () => {
        if (month === 0) {
            setYear(year - 1);
            setMonth(11);
        } else {
            setMonth(month - 1);
        }
    };

    const nextMonth = () => {
        if (month === 11) {
            setYear(year + 1);
            setMonth(0);
        } else {
            setMonth(month + 1);
        }
    };

    /* ---------- 일정 다루기 ---------- */
    const isVisible = (s) => filter === "전체" || s.type === filter; // 필터에 맞는 일정인가?

    // 선택한 날짜가 시작일~종료일 사이에 들어가는 일정들 (기간 일정이 먼저, 그다음 시간순)
    const selectedSchedules = schedules
        .filter((s) => s.start <= selectedKey && selectedKey <= s.end && isVisible(s))
        .sort((a, b) => Number(isPeriod(b)) - Number(isPeriod(a)) || a.time.localeCompare(b.time));

    // 위쪽 요약 숫자는 "달력에서 넘겨 보는 달"이 아니라 "오늘 기준"으로 세요 (달을 넘겨도 안 바뀌게)
    const thisMonthPrefix = todayKey.slice(0, 7); // 예: "2026-10"
    const personalCountThisMonth = schedules.filter(
        (s) => s.start.startsWith(thisMonthPrefix) && s.type === "개인"
    ).length;

    // 참여 프로젝트: 오늘 기간 안에 들어 있는 "프로젝트" 일정의 개수 (일정을 수정하면 같이 바뀌어요)
    const activeProjectCount = schedules.filter(
        (s) => isProject(s) && s.start <= todayKey && todayKey <= s.end
    ).length;

    // 이번 달과 기간이 겹치는 프로젝트들 (필터도 적용)
    const monthStartKey = toKey(year, month, 1);
    const monthEndKey = toKey(year, month, lastDate);
    const monthProjects = schedules
        .filter((s) => isProject(s) && isVisible(s) && s.start <= monthEndKey && s.end >= monthStartKey)
        .sort((a, b) => a.start.localeCompare(b.start));

    // 한 주(weekKeys: 7칸의 날짜 문자열, 빈칸은 null)에 그릴 막대들을 계산
    const getWeekBars = (weekKeys) => {
        const bars = [];

        schedules.filter((s) => isPeriod(s) && !isProject(s) && isVisible(s)).forEach((ev) => {
            let first = -1; // 이 주에서 막대가 시작하는 칸 번호 (0~6)
            let last = -1; // 막대가 끝나는 칸 번호
            weekKeys.forEach((k, c) => {
                if (k && ev.start <= k && k <= ev.end) {
                    if (first === -1) first = c;
                    last = c;
                }
            });
            if (first !== -1) {
                bars.push({
                    ev,
                    first,
                    last,
                    startsHere: weekKeys[first] === ev.start, // 진짜 시작일이면 왼쪽 끝을 둥글게
                    endsHere: weekKeys[last] === ev.end, // 진짜 종료일이면 오른쪽 끝을 둥글게
                });
            }
        });

        // 먼저 시작하는 것, 긴 것 순서로 놓고, 겹치지 않는 가장 위쪽 줄(lane)에 배치
        bars.sort((a, b) => a.first - b.first || b.last - b.first - (a.last - a.first));
        const laneEnd = []; // laneEnd[줄 번호] = 그 줄에서 마지막으로 쓴 칸 번호
        bars.forEach((b) => {
            let lane = 0;
            while (laneEnd[lane] !== undefined && laneEnd[lane] >= b.first) lane++;
            b.lane = lane;
            laneEnd[lane] = b.last;
        });
        return bars;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...form, [name]: value };
        // 시작일을 종료일보다 뒤로 옮기면 종료일도 같이 맞춰 주기
        if (name === "start" && value > form.end) next.end = value;
        setForm(next);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(makeEmptyForm(selectedKey));
        setError("");
    };

    // 날짜를 누르면 그 날짜로 이동해요. 다른 일정을 수정하던 중이었다면 폼은 닫아서
    // "목록은 28일인데 폼은 12일 일정" 같은 어긋남이 없게 해요
    const selectDay = (key) => {
        setSelectedKey(key);
        if (editingId !== null) closeForm();
    };

    const openAddForm = () => {
        setEditingId(null);
        setForm(makeEmptyForm(selectedKey));
        setError("");
        setShowForm(true);
    };

    const openEditForm = (s) => {
        setEditingId(s.id);
        setForm({
            title: s.title,
            start: s.start,
            end: s.end,
            time: s.time || "09:00",
            type: s.type,
        });
        setError("");
        setShowForm(true);
    };

    // 폼이 열리거나 수정 대상이 바뀌면, 폼이 보이는 위치까지 부드럽게 스크롤해요
    useEffect(() => {
        if (showForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [showForm, editingId]);

    const handleSave = () => {
        if (!form.title.trim()) {
            setError("일정 제목을 입력해 주세요.");
            return;
        }
        if (!form.start || !form.end) {
            setError("시작일과 종료일을 입력해 주세요.");
            return;
        }
        if (form.end < form.start) {
            // "2026-10-14" < "2026-10-12" 처럼 문자열로 비교해도 날짜 순서가 맞아요 (YYYY-MM-DD 형식이라서)
            setError("종료일은 시작일과 같거나 그 이후여야 해요.");
            return;
        }

        // 휴가·프로젝트는 시간이 필요 없어서 빈 문자열로 저장
        const needsTime = form.type === "업무" || form.type === "개인";
        const fields = {
            title: form.title.trim(),
            start: form.start,
            end: form.end,
            time: needsTime ? form.time : "",
            type: form.type,
        };

        if (editingId === null) {
            // 새로 등록
            const newItem = { id: Date.now(), ...fields }; // 임시 id (서버 연결 후에는 DB가 만들어 줘요)
            setSchedules([...schedules, newItem]);
        } else {
            // 수정: 같은 id 의 일정만 새 값으로 바꾸고 나머지는 그대로
            setSchedules(schedules.map((s) => (s.id === editingId ? { ...s, ...fields } : s)));
        }
        closeForm();
    };

    const handleDelete = (id) => {
        setSchedules(schedules.filter((s) => s.id !== id));
        if (id === editingId) closeForm(); // 수정 중이던 일정을 지웠다면 폼도 닫기
    };

    /* ---------- 근태 · 연차 계산 ---------- */
    const totalHours = weekHours.reduce((sum, w) => sum + w.hours, 0);
    const avgHours = totalHours / weekHours.length;
    const usedLeave = leaveHistory.reduce((sum, l) => sum + l.days, 0);
    const remainLeave = LEAVE_TOTAL - usedLeave;
    const sortedLeave = [...leaveHistory].sort((a, b) => b.date.localeCompare(a.date));

    /* ---------- 비밀번호 변경 (서버 연결 전: 입력 검사만) ---------- */
    const handlePwChange = (e) => {
        const { name, value } = e.target;
        setPw({ ...pw, [name]: value });
    };

    const handlePwSubmit = (e) => {
        e.preventDefault(); // form 의 기본 동작(페이지 새로고침) 막기

        if (!pw.current || !pw.next || !pw.confirm) {
            setPwMsg({ type: "error", text: "모든 칸을 입력해 주세요." });
            return;
        }
        if (pw.next.length < MIN_PW_LENGTH) {
            setPwMsg({ type: "error", text: `새 비밀번호는 ${MIN_PW_LENGTH}자 이상이어야 해요.` });
            return;
        }
        if (pw.next !== pw.confirm) {
            setPwMsg({ type: "error", text: "새 비밀번호와 확인 칸이 서로 달라요." });
            return;
        }
        if (pw.next === pw.current) {
            setPwMsg({ type: "error", text: "현재 비밀번호와 다른 비밀번호를 써 주세요." });
            return;
        }

        // TODO: 서버 연결 후 여기서 비밀번호 변경 API 호출
        //       (서버가 현재 비밀번호를 bcrypt 로 확인한 뒤, 새 비밀번호를 암호화해 저장해야 해요)
        setPw(EMPTY_PW); // 비밀번호를 화면(state)에 오래 두지 않기
        setPwMsg({ type: "ok", text: "입력 검사를 통과했어요. (프로토타입: 서버 연결 후 실제로 변경돼요)" });
    };

    /* 선택한 날짜를 "10월 22일" 처럼 보여 주기 */
    const [, selM, selD] = selectedKey.split("-");
    const selectedLabel = `${Number(selM)}월 ${Number(selD)}일`;

    return (
        <div className="mypage">
            {/* ===== 상단 프로필 배너 ===== */}
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
                        {/* 이름에 마우스를 올리면(또는 클릭하면) 로그아웃이 나와요 */}
                        <div className="mp-me" tabIndex={0}>
                            <p className="mp-name">
                                {user.name} <span>{user.rank} ▾</span>
                            </p>
                            <div className="mp-logout">
                                <h4><Link to="/login" style={{ display: "block", color: "inherit", textDecoration: "none" }}>로그아웃</Link></h4>
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

            {/* ===== 요약 숫자 3개 ===== */}
            <section className="mp-stats">
                <div className="mp-stat">
                    <span className="mp-stat-label">참여 프로젝트</span>
                    <strong>{activeProjectCount}<small>건</small></strong>
                </div>
                <div className="mp-stat">
                    <span className="mp-stat-label">진행 중 업무</span>
                    <strong>
                        {tasks.filter((t) => t.status === "진행 중").length}
                        <small>건</small>
                    </strong>
                </div>
                <div className="mp-stat">
                    <span className="mp-stat-label">이번 달 개인 일정</span>
                    <strong>{personalCountThisMonth}<small>건</small></strong>
                </div>
            </section>

            {/* ===== 탭 버튼 ===== */}
            <div className="mp-tabs">
                {TABS.map((name) => (
                    <button
                        key={name}
                        type="button"
                        className={tab === name ? "mp-tab active" : "mp-tab"}
                        onClick={() => setTab(name)}
                    >
                        {name}
                    </button>
                ))}
            </div>

            {/* ===== 탭 1: 일정 관리 ===== */}
            {tab === "일정 관리" && (
                <section className="mp-panel">
                    <div className="mp-cal-top">
                        <div className="mp-cal-nav">
                            <button type="button" onClick={prevMonth}>이전</button>
                            <strong>{year}년 {month + 1}월</strong>
                            <button type="button" onClick={nextMonth}>다음</button>
                        </div>
                        <button
                            type="button"
                            className="mp-add-btn"
                            onClick={() => (showForm && editingId === null ? closeForm() : openAddForm())}
                        >
                            + 일정 등록
                        </button>
                    </div>

                    {/* 업무 / 개인 필터 */}
                    <div className="mp-filters" role="group" aria-label="일정 종류 필터">
                        {FILTERS.map((name) => (
                            <button
                                key={name}
                                type="button"
                                className={filter === name ? "mp-chip active" : "mp-chip"}
                                onClick={() => setFilter(name)}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    {monthProjects.length > 0 && (
                        <div className="mp-projects">
                            <h4>진행 중인 프로젝트</h4>
                            {monthProjects.map((p) => {
                                // 오늘 기준으로 "남은 기한"을 계산해요 (오늘 → 종료일까지 몇 일 남았나)
                                const total = countDays(p.start, p.end);
                                let remain; // 남은 일수
                                let label; // 오른쪽에 보여 줄 말
                                if (todayKey < p.start) {
                                    remain = total;
                                    label = `시작까지 ${countDays(todayKey, p.start) - 1}일`;
                                } else if (todayKey > p.end) {
                                    remain = 0;
                                    label = "종료";
                                } else {
                                    remain = countDays(todayKey, p.end) - 1;
                                    label = remain === 0 ? "오늘 마감" : `D-${remain}`;
                                }
                                // 남은 기한 단계로 색을 정해요: 7일 이내 빨강 / 14일 이내 주황 / 그 외 초록 / 끝났거나 시작 전 회색
                                let level = "ok";
                                if (todayKey > p.end || todayKey < p.start) level = "idle";
                                else if (remain <= 7) level = "danger";
                                else if (remain <= 14) level = "warn";
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={`mp-proj ${level}`}
                                        title="클릭하면 수정"
                                        onClick={() => openEditForm(p)}
                                    >
                                        <span className="mp-proj-name">{p.title}</span>
                                        <span
                                            className="mp-proj-track"
                                            role="img"
                                            aria-label={`${p.title} 남은 기한 ${label}`}
                                        >
                                            <span className="mp-proj-fill" style={{ width: `${(remain / total) * 100}%` }} />
                                        </span>
                                        <span className="mp-proj-date">
                                            <strong>{label}</strong> · {p.start.slice(5).replace("-", "/")} ~ {p.end.slice(5).replace("-", "/")} ({total}일)
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="mp-cal">
                        {/* 요일 줄 */}
                        <div className="mp-cal-head">
                            {WEEK_DAYS.map((w, i) => (
                                <div key={w} className={i === 0 ? "mp-week sun" : "mp-week"}>
                                    {w}
                                </div>
                            ))}
                        </div>

                        {/* 주(週)마다 한 줄: 위에는 날짜 칸 7개, 아래에는 기간 막대들 */}
                        {weeks.map((week, wi) => {
                            const weekKeys = week.map((d) => (d === null ? null : toKey(year, month, d)));
                            const bars = getWeekBars(weekKeys);
                            // 막대가 쌓인 줄(lane) 개수: 0줄이면 막대 없음
                            const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

                            return (
                                <div
                                    key={wi}
                                    className="mp-weekrow"
                                    // 1번 줄 = 날짜 숫자 자리(28px), 그다음 막대 줄들(15px씩), 마지막 = 여유 공간
                                    style={{ gridTemplateRows: `28px${" 15px".repeat(laneCount)} minmax(8px, auto)` }}
                                >
                                    {week.map((d, c) => {
                                        if (d === null) {
                                            return <div key={`blank-${c}`} className="mp-blank" style={{ gridColumn: c + 1, gridRow: 1 }} />;
                                        }
                                        const key = weekKeys[c];
                                        // 막대로 그리지 않는 하루짜리 일정만 점으로 표시
                                        const dots = schedules.filter(
                                            (s) => !isPeriod(s) && s.start === key && isVisible(s)
                                        );
                                        const hasWork = dots.some((s) => s.type === "업무");
                                        const hasPersonal = dots.some((s) => s.type === "개인");

                                        let cls = "mp-day";
                                        if (c === 0) cls += " sun";
                                        if (key === todayKey) cls += " today";
                                        if (key === selectedKey) cls += " selected";

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className={cls}
                                                // 날짜 칸을 막대 줄들까지 길게 늘려서, 막대가 칸 "안쪽"에 놓이게 해요
                                                style={{ gridColumn: c + 1, gridRow: `1 / span ${laneCount + 2}` }}
                                                onClick={() => selectDay(key)}
                                            >
                                                {d}
                                                <span className="mp-dots">
                                                    {hasWork && <i className="mp-dot work" />}
                                                    {hasPersonal && <i className="mp-dot personal" />}
                                                </span>
                                            </button>
                                        );
                                    })}

                                    {bars.map((b) => (
                                        <button
                                            key={b.ev.id}
                                            type="button"
                                            className={`mp-seg ${TYPE_CLASS[b.ev.type]}${b.startsHere ? " starts" : ""}${b.endsHere ? " ends" : ""}`}
                                            style={{
                                                gridRow: b.lane + 2,
                                                gridColumn: `${b.first + 1} / ${b.last + 2}`,
                                            }}
                                            title={`${b.ev.title} (${b.ev.start} ~ ${b.ev.end}) · 클릭하면 수정`}
                                            onClick={() => openEditForm(b.ev)}
                                        >
                                            {b.ev.title}
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    <p className="mp-legend">
                        <i className="mp-dot work" /> 업무 &nbsp;
                        <i className="mp-dot personal" /> 개인 &nbsp;
                        <i className="mp-dot leave" /> 휴가 &nbsp;
                        <span className="mp-legend-tip">막대나 프로젝트를 누르면 바로 수정할 수 있어요</span>
                    </p>

                    <div className="mp-day-head">
                        <h3>{selectedLabel} 일정</h3>
                        <span>총 {selectedSchedules.length}건</span>
                    </div>

                    {selectedSchedules.length === 0 && (
                        <p className="mp-empty">
                            {filter === "전체"
                                ? "이 날짜에는 등록된 일정이 없어요."
                                : `이 날짜에는 ${filter} 일정이 없어요.`}
                        </p>
                    )}

                    {selectedSchedules.map((s) => (
                        <div key={s.id} className={`mp-item ${TYPE_CLASS[s.type]}`}>
                            <div>
                                <p className="mp-item-title">{s.title}</p>
                                <p className="mp-item-sub">
                                    {s.start === s.end
                                        ? `${s.time ? `${s.time} · ` : ""}${s.type}`
                                        : `${s.start} ~ ${s.end} (${countDays(s.start, s.end)}일) · ${s.type}`}
                                </p>
                            </div>
                            <div className="mp-actions">
                                <button type="button" className="mp-edit" onClick={() => openEditForm(s)}>
                                    수정
                                </button>
                                <button type="button" className="mp-del" onClick={() => handleDelete(s.id)}>
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}

                    {showForm && (
                        <div className="mp-form" ref={formRef}>
                            <h4>
                                {editingId === null ? "새 일정 등록" : "일정 수정"}
                            </h4>

                            <label>
                                일정 제목
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="예: 연차 휴가, 개발 스터디"
                                />
                            </label>

                            <div className="mp-form-row">
                                <label>
                                    시작일
                                    <input type="date" name="start" value={form.start} onChange={handleChange} />
                                </label>
                                <label>
                                    종료일
                                    <input
                                        type="date"
                                        name="end"
                                        value={form.end}
                                        min={form.start}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>

                            <div className="mp-form-row">
                                <label>
                                    구분
                                    <select name="type" value={form.type} onChange={handleChange}>
                                        {TYPES.map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>
                                {(form.type === "업무" || form.type === "개인") && (
                                    <label>
                                        시간
                                        <input
                                            type="time"
                                            name="time"
                                            value={form.time}
                                            onChange={handleChange}
                                        />
                                    </label>
                                )}
                            </div>

                            {error && <p className="mp-error">{error}</p>}

                            <div className="mp-form-btns">
                                <button type="button" className="mp-cancel" onClick={closeForm}>
                                    취소
                                </button>
                                <button type="button" className="mp-submit" onClick={handleSave}>
                                    {editingId === null ? "일정 추가" : "수정 저장"}
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="mp-note">
                        프로토타입: 일정 등록·수정·삭제는 화면에서만 동작하고, 새로고침하면 처음 상태로 돌아와요.
                        (실제 DB 연결 전 단계)
                    </p>
                </section>
            )}

            {/* ===== 탭 2: 내 업무 ===== */}
            {tab === "내 업무" && (
                <section className="mp-panel">
                    <h3>참여 중인 프로젝트</h3>
                    {projects.map((p) => (
                        <div key={p.id} className="mp-card">
                            <p className="mp-item-title">{p.name}</p>
                            <p className="mp-item-sub">{p.role}</p>
                            <div className="mp-progress">
                                <div className="mp-bar">
                                    <div className="mp-bar-fill" style={{ width: `${p.progress}%` }} />
                                </div>
                                <span>{p.progress}%</span>
                            </div>
                        </div>
                    ))}

                    <h3>내 담당 업무</h3>
                    {tasks.map((t) => (
                        <div key={t.id} className="mp-card mp-task">
                            <span>{t.title}</span>
                            <span className={`mp-badge s-${t.status === "진행 중" ? "doing" : t.status === "완료" ? "done" : "wait"}`}>
                                {t.status}
                            </span>
                        </div>
                    ))}
                </section>
            )}

            {/* ===== 탭 3: 근태·휴가 ===== */}
            {tab === "근태·휴가" && (
                <section className="mp-panel">
                    <h3>이번 주 근무 시간 (시간)</h3>
                    <div
                        className="mp-bars"
                        role="img"
                        aria-label={`이번 주 근무 시간 막대 그래프: ${weekHours
                            .map((w) => `${w.day} ${w.hours}시간`)
                            .join(", ")}`}
                    >
                        {weekHours.map((w) => (
                            <div key={w.day} className="mp-bar-col">
                                <span className="mp-bar-val">{w.hours}</span>
                                <div className="mp-bar-track">
                                    <div
                                        className="mp-bar-v"
                                        style={{ height: `${(w.hours / MAX_HOURS) * 100}%` }}
                                    />
                                </div>
                                <span className="mp-bar-day">{w.day}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mp-note">
                        합계 {totalHours}시간 · 하루 평균 {avgHours.toFixed(1)}시간
                    </p>

                    <h3>연차</h3>
                    <div className="mp-leave-grid">
                        <div className="mp-leave-card">
                            <span className="mp-stat-label">총 연차</span>
                            <strong>{LEAVE_TOTAL}<small>일</small></strong>
                        </div>
                        <div className="mp-leave-card">
                            <span className="mp-stat-label">사용</span>
                            <strong>{usedLeave}<small>일</small></strong>
                        </div>
                        <div className="mp-leave-card remain">
                            <span className="mp-stat-label">남은 연차</span>
                            <strong>{remainLeave}<small>일</small></strong>
                        </div>
                    </div>

                    <h3>연차 사용 내역</h3>
                    {sortedLeave.map((l) => (
                        <div key={l.id} className="mp-card mp-task">
                            <span>{l.date} · {l.type}</span>
                            <span className="mp-badge s-wait">{l.days}일</span>
                        </div>
                    ))}

                    <p className="mp-note">
                        프로토타입: 근무 시간과 연차는 예시 숫자예요. 실제 값은 근태 데이터와 연결한 뒤 채워져요.
                    </p>
                </section>
            )}

            {/* ===== 탭 4: 내 활동 (내가 등록한 이슈·공지) ===== */}
            {tab === "내 활동" && (
                <section className="mp-panel">
                    <h3>내가 등록한 이슈</h3>
                    {myIssues.length === 0 && <p className="mp-empty">등록한 이슈가 없어요.</p>}
                    {myIssues.map((i) => (
                        <div key={i.id} className="mp-card mp-task">
                            <div>
                                <p className="mp-item-title">{i.title}</p>
                                <p className="mp-item-sub">{i.date}</p>
                            </div>
                            <span className={`mp-badge s-${i.status === "완료" ? "done" : "doing"}`}>
                                {i.status}
                            </span>
                        </div>
                    ))}
                    <Link className="mp-more" to="/Issue">이슈관리에서 전체 보기 →</Link>

                    <h3>내가 등록한 공지</h3>
                    {myNotices.length === 0 && <p className="mp-empty">등록한 공지가 없어요.</p>}
                    {myNotices.map((n) => (
                        <div key={n.id} className="mp-card">
                            <p className="mp-item-title">{n.title}</p>
                            <p className="mp-item-sub">{n.date}</p>
                        </div>
                    ))}
                    <Link className="mp-more" to="/Info">공지사항에서 전체 보기 →</Link>

                    <p className="mp-note">
                        프로토타입: 목록은 예시예요. 이슈관리·공지사항 페이지의 실제 데이터와 연결하려면 담당 팀원과 맞춰야 해요.
                    </p>
                </section>
            )}

            {/* ===== 탭 5: 내 정보 (보기 전용) + 비밀번호 변경 ===== */}
            {tab === "내 정보" && (
                <section className="mp-panel">
                    <h3>내 개인정보</h3>
                    <div className="mp-info">
                        <label>
                            이름
                            <input value={user.name} readOnly />
                        </label>
                        <label>
                            사원번호
                            <input value={user.empNo} readOnly />
                        </label>
                        <label>
                            부서
                            <input value={`${user.division} / ${user.team}`} readOnly />
                        </label>
                        <label>
                            직급
                            <input value={user.rank} readOnly />
                        </label>
                    </div>
                    <p className="mp-note">
                        내 정보는 확인만 할 수 있어요. 변경이 필요하면 관리자에게 요청해 주세요.
                    </p>

                    <h3>비밀번호 변경</h3>
                    <form className="mp-info" onSubmit={handlePwSubmit}>
                        <label>
                            현재 비밀번호
                            <input
                                type="password"
                                name="current"
                                value={pw.current}
                                onChange={handlePwChange}
                                autoComplete="current-password"
                            />
                        </label>
                        <label>
                            새 비밀번호 ({MIN_PW_LENGTH}자 이상)
                            <input
                                type="password"
                                name="next"
                                value={pw.next}
                                onChange={handlePwChange}
                                autoComplete="new-password"
                            />
                        </label>
                        <label>
                            새 비밀번호 확인
                            <input
                                type="password"
                                name="confirm"
                                value={pw.confirm}
                                onChange={handlePwChange}
                                autoComplete="new-password"
                            />
                        </label>

                        {pwMsg && (
                            <p className={pwMsg.type === "ok" ? "mp-ok" : "mp-error"}>{pwMsg.text}</p>
                        )}

                        <button type="submit" className="mp-submit">비밀번호 변경</button>
                    </form>
                    <p className="mp-note">
                        프로토타입: 지금은 입력 검사만 해요. 실제 변경은 서버에서 현재 비밀번호를 확인하고
                        새 비밀번호를 암호화해 저장하는 API를 만든 뒤 연결해요.
                    </p>
                </section>
            )}
        </div>
    );
}

export default Mypage;
