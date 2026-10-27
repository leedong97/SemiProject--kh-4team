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

// 체험 모드(더미 계정)용 샘플 데이터
const dummyProjects = [
    { id: 1, name: "KB국민은행 고객정보 통합관리", role: "백엔드 개발 담당", progress: 65, status: "진행중", start: "2026-10-05", end: "2026-11-27" },
    { id: 2, name: "삼성전자 생산·재고관리 시스템", role: "API 개발 지원", progress: 30, status: "진행중", start: "2026-10-19", end: "2026-12-18" },
];

const dummyTasks = [
    { id: 1, title: "고객정보 등록 API 개발", status: "진행 중" },
    { id: 2, title: "고객정보 테이블 설계", status: "완료" },
    { id: 3, title: "프로젝트 QA 테스트", status: "대기" },
];

const initialSchedules = [
    { id: 1, start: "2026-10-22", end: "2026-10-22", title: "ERP 개발팀 주간 회의", time: "10:00", type: "업무" },
    { id: 2, start: "2026-10-22", end: "2026-10-22", title: "개인 학습 및 코드 리뷰", time: "19:00", type: "개인" },
    { id: 3, start: "2026-10-25", end: "2026-10-25", title: "프로젝트 중간 점검", time: "14:00", type: "업무" },
    { id: 4, start: "2026-10-28", end: "2026-10-28", title: "QA 테스트 준비", time: "11:00", type: "업무" },
];

const weekHours = [
    { day: "월", hours: 8.5 },
    { day: "화", hours: 9 },
    { day: "수", hours: 8 },
    { day: "목", hours: 9.5 },
    { day: "금", hours: 7.5 },
];
const MAX_HOURS = 12;

const LEAVE_TOTAL = 15;
const leaveHistory = [
    { id: 1, start: "2026-10-02", end: "2026-10-02", type: "반차", days: 0.5, status: "승인" },
    { id: 2, start: "2026-09-14", end: "2026-09-14", type: "반차", days: 0.5, status: "승인" },
    { id: 3, start: "2026-10-12", end: "2026-10-14", type: "연차", days: 3, status: "승인" },
    { id: 4, start: "2026-07-17", end: "2026-07-17", type: "연차", days: 1, status: "승인" },
    { id: 5, start: "2026-05-05", end: "2026-05-05", type: "연차", days: 1, status: "승인" },
    { id: 6, start: "2026-02-09", end: "2026-02-09", type: "연차", days: 1, status: "승인" },
];

const myIssues = [
    { id: 1, title: "로그인 화면 오류 제보", status: "진행 중", date: "2026-10-19" },
    { id: 2, title: "회원가입 비밀번호 검증 누락", status: "완료", date: "2026-10-15" },
];
const myNotices = [{ id: 1, title: "11월 정기 보안 교육 안내", date: "2026-10-20", pinned: true }];

// 화면에서 쓰는 상수
const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TABS = ["일정 관리", "내 업무", "근태·휴가", "내 활동", "내 정보"];
const TYPES = ["개인", "업무", "휴가"];
const FILTERS = ["전체", ...TYPES, "프로젝트"];
const TYPE_CLASS = { 업무: "work", 개인: "personal", 휴가: "leave", 프로젝트: "project" };
const EMPTY_PW = { current: "", next: "", confirm: "" };
const makeEmptyForm = (key) => ({ title: "", start: key, end: key, time: "09:00", type: "개인" });
const MIN_PW_LENGTH = 8;

// 날짜 계산 도구 함수
const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const isPeriod = (s) => s.type === "휴가" || s.type === "프로젝트" || s.start !== s.end;

const isProject = (s) => s.type === "프로젝트";

const countDays = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000) + 1;

// 마이페이지 화면 (탭별 화면은 components 폴더로 분리)
function Mypage() {
    const user = getLoginUser();

    const today = new Date();
    const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

    // 화면 상태값 (탭·달력·일정·필터)
    const [tab, setTab] = useState("일정 관리");
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selectedKey, setSelectedKey] = useState(todayKey);
    const [schedules, setSchedules] = useState(user.isDummy ? initialSchedules : []);
    const [filter, setFilter] = useState("전체");

    // 내 프로젝트·업무 조회 (DB)
    const [projects, setProjects] = useState(user.isDummy ? dummyProjects : []);
    const [tasks, setTasks] = useState(user.isDummy ? dummyTasks : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/my-projects", { params: { employeeId: user.id } })
            .then((res) => setProjects(res.data.projects))
            .catch((err) => console.error("프로젝트를 불러오지 못했어요:", err));
        axios
            .get("http://localhost:3333/api/my-tasks", { params: { employeeId: user.id } })
            .then((res) => setTasks(res.data.tasks))
            .catch((err) => console.error("업무를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 내 이슈 조회 (DB)
    const [issues, setIssues] = useState(user.isDummy ? myIssues : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/my-issues", { params: { employeeId: user.id } })
            .then((res) => setIssues(res.data.issues))
            .catch((err) => console.error("이슈를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 내 공지 조회 (DB)
    const [notices, setNotices] = useState(user.isDummy ? myNotices : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/my-notices", { params: { employeeId: user.id } })
            .then((res) => setNotices(res.data.notices))
            .catch((err) => console.error("공지를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 이번 주 근무시간·총 연차 조회 (DB)
    const [weekHoursData, setWeekHoursData] = useState(
        user.isDummy ? weekHours : ["월", "화", "수", "목", "금"].map((day) => ({ day, hours: 0 }))
    );
    const [leaveTotalData, setLeaveTotalData] = useState(LEAVE_TOTAL);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/my-attendance", { params: { employeeId: user.id } })
            .then((res) => {
                setWeekHoursData(res.data.weekHours);
                setLeaveTotalData(res.data.leaveTotal);
            })
            .catch((err) => console.error("근태 정보를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 일정 입력 폼 상태
    const [showForm, setShowForm] = useState(false);
    const formRef = useRef(null);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(makeEmptyForm(todayKey));
    const [error, setError] = useState("");

    // 비밀번호 변경 폼 상태
    const [pw, setPw] = useState(EMPTY_PW);
    const [pwMsg, setPwMsg] = useState(null);

    // 달력 칸 계산
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    // 이전·다음 달 이동
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

    // 선택한 날의 일정·필터 계산
    const isVisible = (s) => filter === "전체" || s.type === filter;

    const selectedSchedules = schedules
        .filter((s) => s.start <= selectedKey && selectedKey <= s.end && isVisible(s))
        .sort((a, b) => Number(isPeriod(b)) - Number(isPeriod(a)) || (a.time || "").localeCompare(b.time || ""));

    const thisMonthPrefix = todayKey.slice(0, 7);
    const personalCountThisMonth = schedules.filter(
        (s) => s.start.startsWith(thisMonthPrefix) && s.type === "개인"
    ).length;

    // 프로젝트 막대 계산
    const projectBars = projects
        .filter((p) => p.status !== "완료" && p.start && p.end)
        .map((p) => ({ id: p.id, title: p.name, start: p.start, end: p.end, status: p.status }))
        .sort((a, b) => a.start.localeCompare(b.start));

    const activeProjectCount = projectBars.filter((p) => p.status === "진행중").length;

    const visibleProjectBars = filter === "전체" || filter === "프로젝트" ? projectBars : [];

    // 기간 일정 막대 배치 계산
    const getWeekBars = (weekKeys) => {
        const bars = [];

        schedules.filter((s) => isPeriod(s) && !isProject(s) && isVisible(s)).forEach((ev) => {
            let first = -1;
            let last = -1;
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
                    startsHere: weekKeys[first] === ev.start,
                    endsHere: weekKeys[last] === ev.end,
                });
            }
        });

        bars.sort((a, b) => a.first - b.first || b.last - b.first - (a.last - a.first));
        const laneEnd = [];
        bars.forEach((b) => {
            let lane = 0;
            while (laneEnd[lane] !== undefined && laneEnd[lane] >= b.first) lane++;
            b.lane = lane;
            laneEnd[lane] = b.last;
        });
        return bars;
    };

    // 일정 폼 입력·열기·닫기 처리
    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = { ...form, [name]: value };
        if (name === "start" && value > form.end) next.end = value;
        setForm(next);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(makeEmptyForm(selectedKey));
        setError("");
    };

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

    // 일정 목록 조회 (DB)
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/schedules", { params: { employeeId: user.id } })
            .then((res) => setSchedules(res.data.schedules.filter((s) => !isProject(s))))
            .catch((err) => console.error("일정을 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 내 휴가 내역 조회 (DB)
    const [leaves, setLeaves] = useState(user.isDummy ? leaveHistory : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/leaves", { params: { employeeId: user.id } })
            .then((res) => setLeaves(res.data.leaves))
            .catch((err) => console.error("휴가 내역을 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 폼이 열리면 폼 위치로 스크롤
    useEffect(() => {
        if (showForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [showForm, editingId]);

    // 일정 저장 (추가·수정)
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
            setError("종료일은 시작일과 같거나 그 이후여야 해요.");
            return;
        }

        const needsTime = form.type === "업무" || form.type === "개인";
        const fields = {
            title: form.title.trim(),
            start: form.start,
            end: form.end,
            time: needsTime ? form.time : "",
            type: form.type,
        };

        if (user.isDummy) {
            if (editingId === null) {
                setSchedules([...schedules, { id: Date.now(), ...fields }]);
            } else {
                setSchedules(schedules.map((s) => (s.id === editingId ? { ...s, ...fields } : s)));
            }
            closeForm();
            return;
        }

        if (editingId === null) {
            axios
                .post("http://localhost:3333/api/schedules", { employeeId: user.id, ...fields })
                .then((res) => {
                    setSchedules([...schedules, { id: res.data.id, ...fields }]);
                    closeForm();
                })
                .catch((err) => {
                    setError(err.response?.data?.message || "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
                });
        } else {
            axios
                .put(`http://localhost:3333/api/schedules/${editingId}`, { employeeId: user.id, ...fields })
                .then(() => {
                    setSchedules(schedules.map((s) => (s.id === editingId ? { ...s, ...fields } : s)));
                    closeForm();
                })
                .catch((err) => {
                    setError(err.response?.data?.message || "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
                });
        }
    };

    // 일정 삭제
    const handleDelete = (id) => {
        if (user.isDummy) {
            setSchedules(schedules.filter((s) => s.id !== id));
            if (id === editingId) closeForm();
            return;
        }
        axios
            .delete(`http://localhost:3333/api/schedules/${id}`, { params: { employeeId: user.id } })
            .then(() => {
                setSchedules(schedules.filter((s) => s.id !== id));
                if (id === editingId) closeForm();
            })
            .catch(() => {
                setError("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
            });
    };

    // 요약 카드용 진행 중 업무 수
    const inProgressCount = tasks.filter((t) => t.status === "진행 중").length;

    // 비밀번호 변경 입력 검사 (서버 연결은 TODO)
    const handlePwChange = (e) => {
        const { name, value } = e.target;
        setPw({ ...pw, [name]: value });
    };

    const handlePwSubmit = (e) => {
        e.preventDefault();

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

        setPw(EMPTY_PW);
        setPwMsg({ type: "ok", text: "입력 검사를 통과했어요. (프로토타입: 서버 연결 후 실제로 변경돼요)" });
    };

    const [, selM, selD] = selectedKey.split("-");
    const selectedLabel = `${Number(selM)}월 ${Number(selD)}일`;

    // 화면 그리기
    return (
        <div className="mypage">
            <ProfileBanner user={user} />

            <SummaryCards
                activeProjectCount={activeProjectCount}
                inProgressCount={inProgressCount}
                personalCountThisMonth={personalCountThisMonth}
            />

            <TabBar tab={tab} setTab={setTab} TABS={TABS} />

            {/* 일정 관리 탭 */}
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

                    <ProjList projectBars={visibleProjectBars} todayKey={todayKey} countDays={countDays} />

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

                    {user.isDummy && (
                        <p className="mp-note">
                            체험 모드: 로그인하지 않아서 일정 등록·수정·삭제가 화면에서만 동작하고, 새로고침하면 처음 상태로 돌아와요.
                        </p>
                    )}
                </section>
            )}

            {/* 내 업무 탭 */}
            {tab === "내 업무" && <MyWorkTab projects={projects} tasks={tasks} />}

            {/* 근태·휴가 탭 */}
            {tab === "근태·휴가" && (
                <AttendanceTab
                    weekHours={weekHoursData}
                    maxHours={MAX_HOURS}
                    leaveTotal={leaveTotalData}
                    leaveHistory={leaves}
                    todayKey={todayKey}
                    isDemo={user.isDummy}
                />
            )}

            {/* 내 활동 탭 */}
            {tab === "내 활동" && <MyActivityTab myIssues={issues} myNotices={notices} />}

            {/* 내 정보 탭 */}
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
