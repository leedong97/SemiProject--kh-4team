import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import getLoginUser from "./getLoginUser";
import ProfileBanner from "./components/mypageCommon/ProfileBanner";
import SummaryCards from "./components/mypageCommon/SummaryCards";
import TabBar from "./components/mypageCommon/TabBar";
import CalHead from "./components/mypageCal/CalHead";
import FilterBar from "./components/mypageCal/FilterBar";
import ProjList from "./components/mypageCal/ProjList";
import CalGrid from "./components/mypageCal/CalGrid";
import DayList from "./components/mypageCal/DayList";
import SchForm from "./components/mypageCal/SchForm";
import MyWorkTab from "./components/mypageTab/MyWorkTab";
import AttendanceTab from "./components/mypageTab/AttendanceTab";
import MyActivityTab from "./components/mypageTab/MyActivityTab";
import MyInfoTab from "./components/mypageTab/MyInfoTab";
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
const MIN_PW_LENGTH = 8; // 비밀번호 최소 길이

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
    // 로그인한 직원 정보 (로그인 없이 들어오면 shared/user.js 더미가 들어와요: isDummy)
    const user = getLoginUser();

    const today = new Date();
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    const [tab, setTab] = useState("일정 관리");
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth()); // 0 = 1월
    const [selectedKey, setSelectedKey] = useState(todayKey);
    // 로그인한 직원이면 DB에서 가져올 때까지 빈 목록, 더미 사용자면 예전 더미 일정을 그대로 써요
    const [schedules, setSchedules] = useState(user.isDummy ? initialSchedules : []);
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
        .sort((a, b) => Number(isPeriod(b)) - Number(isPeriod(a)) || (a.time || "").localeCompare(b.time || ""));

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

    // 로그인한 직원의 일정을 서버(DB)에서 한 번 가져와요. (처음 화면이 뜰 때 + 직원이 바뀔 때)
    useEffect(() => {
        if (user.isDummy) return; // 더미 사용자는 서버에서 가져올 일정이 없어요
        axios
            .get("http://localhost:3333/api/schedules", { params: { employeeId: user.id } })
            .then((res) => setSchedules(res.data.schedules))
            .catch((err) => console.error("일정을 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

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


    // 진행 중 업무 개수 (요약 카드에 보여 줘요)
    const inProgressCount = tasks.filter((t) => t.status === "진행 중").length;

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
            <ProfileBanner user={user} />

            {/* ===== 요약 숫자 3개 ===== */}
            <SummaryCards
                activeProjectCount={activeProjectCount}
                inProgressCount={inProgressCount}
                personalCountThisMonth={personalCountThisMonth}
            />

            {/* ===== 탭 버튼 ===== */}
            <TabBar tab={tab} setTab={setTab} TABS={TABS} />

            {/* ===== 탭 1: 일정 관리 ===== */}
            {tab === "일정 관리" && (
                <section className="mp-panel">
                    <CalHead
                        year={year}
                        month={month}
                        prevMonth={prevMonth}
                        nextMonth={nextMonth}
                        showForm={showForm}
                        editingId={editingId}
                        closeForm={closeForm}
                        openAddForm={openAddForm}
                    />

                    <FilterBar filter={filter} setFilter={setFilter} FILTERS={FILTERS} />

                    <ProjList
                        monthProjects={monthProjects}
                        todayKey={todayKey}
                        openEditForm={openEditForm}
                        countDays={countDays}
                    />

                    <CalGrid
                        WEEK_DAYS={WEEK_DAYS}
                        weeks={weeks}
                        year={year}
                        month={month}
                        getWeekBars={getWeekBars}
                        schedules={schedules}
                        isPeriod={isPeriod}
                        isVisible={isVisible}
                        toKey={toKey}
                        todayKey={todayKey}
                        selectedKey={selectedKey}
                        selectDay={selectDay}
                        TYPE_CLASS={TYPE_CLASS}
                        openEditForm={openEditForm}
                    />

                    <DayList
                        selectedLabel={selectedLabel}
                        selectedSchedules={selectedSchedules}
                        filter={filter}
                        countDays={countDays}
                        TYPE_CLASS={TYPE_CLASS}
                        openEditForm={openEditForm}
                        handleDelete={handleDelete}
                    />

                    <SchForm
                        showForm={showForm}
                        formRef={formRef}
                        editingId={editingId}
                        form={form}
                        handleChange={handleChange}
                        TYPES={TYPES}
                        error={error}
                        closeForm={closeForm}
                        handleSave={handleSave}
                    />

                    <p className="mp-note">
                        프로토타입: 일정 등록·수정·삭제는 화면에서만 동작하고, 새로고침하면 처음 상태로 돌아와요.
                        (실제 DB 연결 전 단계)
                    </p>
                </section>
            )}

            {/* ===== 탭 2: 내 업무 ===== */}
            {tab === "내 업무" && <MyWorkTab projects={projects} tasks={tasks} />}

            {/* ===== 탭 3: 근태·휴가 ===== */}
            {tab === "근태·휴가" && (
                <AttendanceTab
                    weekHours={weekHours}
                    maxHours={MAX_HOURS}
                    leaveTotal={LEAVE_TOTAL}
                    leaveHistory={leaveHistory}
                />
            )}

            {/* ===== 탭 4: 내 활동 (내가 등록한 이슈·공지) ===== */}
            {tab === "내 활동" && <MyActivityTab myIssues={myIssues} myNotices={myNotices} />}

            {/* ===== 탭 5: 내 정보 (보기 전용) + 비밀번호 변경 ===== */}
            {tab === "내 정보" && (
                <MyInfoTab
                    user={user}
                    pw={pw}
                    pwMsg={pwMsg}
                    minPwLength={MIN_PW_LENGTH}
                    handlePwChange={handlePwChange}
                    handlePwSubmit={handlePwSubmit}
                />
            )}
        </div>
    );
}

export default Mypage;
