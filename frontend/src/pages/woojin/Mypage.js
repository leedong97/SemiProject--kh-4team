import { API_BASE } from '../../shared/config';
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

// dummyProjects 배열에 프로젝트 객체({ })들을 담는다 (객체 하나 = 프로젝트 1개)
const dummyProjects = [
    { id: 1, name: "KB국민은행 고객정보 통합관리", role: "백엔드 개발 담당", progress: 65, status: "진행중", start: "2026-10-05", end: "2026-11-27" },
    { id: 2, name: "삼성전자 생산·재고관리 시스템", role: "API 개발 지원", progress: 30, status: "진행중", start: "2026-10-19", end: "2026-12-18" },
];
// dummyTasks 배열에 업무 객체({})들을 담는다
const dummyTasks = [
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
];

// 이번 주 근무 시간 (시간 단위)
const weekHours = [
    { day: "월", hours: 8.5 },
    { day: "화", hours: 9 },
    { day: "수", hours: 8 },
    { day: "목", hours: 9.5 },
    { day: "금", hours: 7.5 },
];
const MAX_HOURS = 12; // 막대 그래프에서 100% 높이로 보는 기준 (직급이 높은 직원은 10시간을 넘는 날도 있어서 12로 잡아요)

// 연차
const LEAVE_TOTAL = 15;
// (서버에서 받는 휴가 모양과 똑같이 start·end·status를 둬요. 로그인 없이 들어온 더미 사용자만 이 값을 써요)
const leaveHistory = [
    { id: 1, start: "2026-10-02", end: "2026-10-02", type: "반차", days: 0.5, status: "승인" },
    { id: 2, start: "2026-09-14", end: "2026-09-14", type: "반차", days: 0.5, status: "승인" },
    { id: 3, start: "2026-10-12", end: "2026-10-14", type: "연차", days: 3, status: "승인" },
    { id: 4, start: "2026-07-17", end: "2026-07-17", type: "연차", days: 1, status: "승인" },
    { id: 5, start: "2026-05-05", end: "2026-05-05", type: "연차", days: 1, status: "승인" },
    { id: 6, start: "2026-02-09", end: "2026-02-09", type: "연차", days: 1, status: "승인" },
];

// 내가 등록한 이슈·공지
const myIssues = [
    { id: 1, title: "로그인 화면 오류 제보", status: "진행 중", date: "2026-10-19" },
    { id: 2, title: "회원가입 비밀번호 검증 누락", status: "완료", date: "2026-10-15" },
];
const myNotices = [{ id: 1, title: "11월 정기 보안 교육 안내", date: "2026-10-20", pinned: true }];

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TABS = ["일정 관리", "내 업무", "근태·휴가", "내 활동", "내 정보"];
// 일정 등록 폼에서 고를 수 있는 유형. "프로젝트"는 관리자 페이지에서만 등록하므로 마이페이지 폼에는 없어요.
const TYPES = ["개인", "업무", "휴가"];
// 필터 버튼: "프로젝트"를 누르면 위쪽 프로젝트 막대만 보여요
const FILTERS = ["전체", ...TYPES, "프로젝트"];
// 일정 종류 → CSS 클래스 이름
const TYPE_CLASS = { 업무: "work", 개인: "personal", 휴가: "leave", 프로젝트: "project" };
const EMPTY_PW = { current: "", next: "", confirm: "" };
const makeEmptyForm = (key) => ({ title: "", start: key, end: key, time: "09:00", type: "개인" });
const MIN_PW_LENGTH = 8; // 비밀번호 최소 길이

/* ---------------------------------------------------------
   2) 날짜를 "2026-10-22" 형태의 문자열로 바꿔 주는 도우미 함수
      (월은 0~11 이라서 +1 해 줘야 해요)
--------------------------------------------------------- */
// 앞자리를 0으로 2자리를 채운 문자열을 패드에 담는다
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

    // 내가 참여한 프로젝트와 내 담당 업무: 로그인한 직원이면 DB에서 가져올 때까지 빈 목록, 더미 사용자면 예전 더미를 그대로 써요
    const [projects, setProjects] = useState(user.isDummy ? dummyProjects : []);
    const [tasks, setTasks] = useState(user.isDummy ? dummyTasks : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/my-projects`, { params: { employeeId: user.id } })
            .then((res) => setProjects(res.data.projects))
            .catch((err) => console.error("프로젝트를 불러오지 못했어요:", err));
        axios
            .get(`${API_BASE}/api/my-tasks`, { params: { employeeId: user.id } })
            .then((res) => setTasks(res.data.tasks))
            .catch((err) => console.error("업무를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 내가 등록한 이슈: 로그인한 직원이면 DB에서, 더미 사용자면 위쪽 더미 배열을 써요
    const [issues, setIssues] = useState(user.isDummy ? myIssues : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/my-issues`, { params: { employeeId: user.id } })
            .then((res) => setIssues(res.data.issues))
            .catch((err) => console.error("이슈를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 내가 등록한 공지: 이슈와 같은 방식이에요
    const [notices, setNotices] = useState(user.isDummy ? myNotices : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/my-notices`, { params: { employeeId: user.id } })
            .then((res) => setNotices(res.data.notices))
            .catch((err) => console.error("공지를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 이번 주 근무 시간과 올해 총 연차: 로그인한 직원이면 DB(attendance_records, leave_balances)에서,
    // 더미 사용자면 위쪽 예시 값을 써요. 서버를 기다리는 동안 로그인 직원은 "기록 없음(0시간)"으로 그려요.
    const [weekHoursData, setWeekHoursData] = useState(
        user.isDummy ? weekHours : ["월", "화", "수", "목", "금"].map((day) => ({ day, hours: 0 }))
    );
    const [leaveTotalData, setLeaveTotalData] = useState(LEAVE_TOTAL);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/my-attendance`, { params: { employeeId: user.id } })
            .then((res) => {
                setWeekHoursData(res.data.weekHours);
                setLeaveTotalData(res.data.leaveTotal);
            })
            .catch((err) => console.error("근태 정보를 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

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

    // 프로젝트는 관리자 페이지에서만 등록하고, 마이페이지는 DB(projects + project_members)에서 읽어 와 보여 주기만 해요.
    // 위쪽 카드, 일정 탭의 막대, "내 업무" 탭이 모두 같은 projects 데이터를 쓰니까 숫자와 목록이 어긋나지 않아요.
    // 막대로 그릴 프로젝트: "완료"가 아니고, 시작일·종료일이 둘 다 있는 것 (날짜가 비어 있으면 막대를 못 그려요)
    const projectBars = projects
        .filter((p) => p.status !== "완료" && p.start && p.end)
        .map((p) => ({ id: p.id, title: p.name, start: p.start, end: p.end, status: p.status }))
        .sort((a, b) => a.start.localeCompare(b.start));

    // 진행 중 프로젝트: 막대에 있는 것 중 상태가 "진행중"인 개수 (DB의 projects.status 글자는 붙여 쓴 "진행중")
    // 업무 상태 "진행 중"은 띄어 쓰니 헷갈리지 않게 주의!
    const activeProjectCount = projectBars.filter((p) => p.status === "진행중").length;

    // 필터가 "전체"나 "프로젝트"일 때만 막대를 보여 줘요 (개인·업무·휴가만 보고 싶을 땐 숨겨요)
    const visibleProjectBars = filter === "전체" || filter === "프로젝트" ? projectBars : [];

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
            .get(`${API_BASE}/api/schedules`, { params: { employeeId: user.id } })
            .then((res) => setSchedules(res.data.schedules.filter((s) => !isProject(s))))
            .catch((err) => console.error("일정을 불러오지 못했어요:", err));
    }, [user.id, user.isDummy]);

    // 로그인한 직원의 휴가 신청 내역을 서버(DB)에서 한 번 가져와요. 일정과 같은 방식이에요.
    // 로그인한 직원이면 DB에서 가져올 때까지 빈 목록, 더미 사용자면 예전 더미 휴가를 그대로 써요
    const [leaves, setLeaves] = useState(user.isDummy ? leaveHistory : []);
    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get(`${API_BASE}/api/leaves`, { params: { employeeId: user.id } })
            .then((res) => setLeaves(res.data.leaves))
            .catch((err) => console.error("휴가 내역을 불러오지 못했어요:", err));
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

        // 로그인 없이 들어온 더미 사용자는 서버에 저장할 직원이 없어서 예전처럼 화면에서만 바꿔요
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
            // 새로 등록: 서버(DB)에 저장하고, DB가 만든 번호(res.data.id)를 일정의 id로 써요
            axios
                .post(`${API_BASE}/api/schedules`, { employeeId: user.id, ...fields })
                .then((res) => {
                    setSchedules([...schedules, { id: res.data.id, ...fields }]);
                    closeForm();
                })
                .catch((err) => {
                    setError(err.response?.data?.message || "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
                });
        } else {
            // 수정: 서버(DB)에서 먼저 고치고, 성공하면 화면 목록도 같은 id의 일정만 바꿔요
            axios
                .put(`${API_BASE}/api/schedules/${editingId}`, { employeeId: user.id, ...fields })
                .then(() => {
                    setSchedules(schedules.map((s) => (s.id === editingId ? { ...s, ...fields } : s)));
                    closeForm();
                })
                .catch((err) => {
                    setError(err.response?.data?.message || "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
                });
        }
    };

    const handleDelete = (id) => {
        // 더미 사용자는 화면에서만 지워요
        if (user.isDummy) {
            setSchedules(schedules.filter((s) => s.id !== id));
            if (id === editingId) closeForm();
            return;
        }
        // 서버(DB)에서 먼저 지우고, 성공하면 화면 목록에서도 지워요
        axios
            .delete(`${API_BASE}/api/schedules/${id}`, { params: { employeeId: user.id } })
            .then(() => {
                setSchedules(schedules.filter((s) => s.id !== id));
                if (id === editingId) closeForm(); // 수정 중이던 일정을 지웠다면 폼도 닫기
            })
            .catch(() => {
                setError("삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
            });
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

            {/* ===== 탭 2: 내 업무 ===== */}
            {tab === "내 업무" && <MyWorkTab projects={projects} tasks={tasks} />}

            {/* ===== 탭 3: 근태·휴가 ===== */}
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

            {/* ===== 탭 4: 내 활동 (내가 등록한 이슈·공지) ===== */}
            {tab === "내 활동" && <MyActivityTab myIssues={issues} myNotices={notices} />}

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
