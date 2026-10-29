// ===== 마이페이지 탭에 쓰는 조회 API 모음 =====
// /api/leaves, /api/my-projects, /api/my-tasks, /api/my-issues, /api/my-notices, /api/my-attendance
// 앞부분 "/api" 는 woojin/index.js 에서 붙여 준다.
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();
const pool = require("../db");

// ===== 휴가 이력 조회 =====
// GET 방식으로 /api/leaves 요청이 오면 한 직원의 휴가 신청 목록을 돌려준다. (주소의 ?employeeId=1을 req.query로 읽는다)
router.get("/leaves", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // DATE_FORMAT: 날짜를 "2026-11-09" 글자로 바꾼다 (시간대로 날짜가 밀리는 문제 방지)
        // CASE WHEN: 반차면 0.5일, 아니면 (종료일 - 시작일) + 1 일. +1은 시작일과 종료일을 둘 다 센다는 뜻이다.
        // DATEDIFF(끝, 시작): 두 날짜 사이의 날 수
        // ORDER BY start_date DESC: 최근 휴가가 위로 오게 정렬
        const [rows] = await pool.query(
            "SELECT leave_id AS id, " +
            "DATE_FORMAT(start_date, '%Y-%m-%d') AS `start`, " +
            "DATE_FORMAT(end_date, '%Y-%m-%d') AS `end`, " +
            "leave_type AS `type`, status, " +
            "CASE WHEN leave_type = '반차' THEN 0.5 ELSE DATEDIFF(end_date, start_date) + 1 END AS days " +
            "FROM leave_requests WHERE employee_id = ? " +
            "ORDER BY start_date DESC",
            [employeeId]
        );
        // days는 소수(DECIMAL)라서 mysql2가 글자("0.5")로 돌려준다. 화면에서 더하기를 하려면 숫자여야 해서 Number()로 바꾼다.
        // ...r: 그 줄의 모든 칸을 복사하고, days만 숫자로 덮어쓴다.
        res.json({ ok: true, leaves: rows.map((r) => ({ ...r, days: Number(r.days) })) });
    } catch (err) {
        console.error("휴가 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내가 참여한 프로젝트 목록 (마이페이지 "내 업무" 탭 + 위쪽 "참여 프로젝트" 카드가 같이 쓴다)
// 주소 예: /api/my-projects?employeeId=21
router.get("/my-projects", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // project_members: "누가 어느 프로젝트에 참여하는지" 명단 표 / projects: 프로젝트 이름·진행률이 있는 표
        // JOIN ... ON: 두 표를 project_id 가 같은 줄끼리 이어 붙인다 (명단에는 번호만 있어서 이름은 projects에서 가져온다)
        // WHERE pm.employee_id = ?: 내가 명단에 있는 프로젝트만
        // AS: DB 칸 이름을 화면이 쓰는 이름(id, name, role, progress, status, start, end)으로 바꾼다
        // DATE_FORMAT: 날짜를 "2026-10-27" 글자로 바꿔 보낸다 (날짜가 비어 있으면 NULL 그대로 가서 화면이 막대에서 뺀다)
        const [rows] = await pool.query(
            "SELECT p.project_id AS id, p.project_title AS name, pm.role AS role, " +
            "p.project_progress AS progress, p.status AS status, " +
            "DATE_FORMAT(p.start_date, '%Y-%m-%d') AS `start`, DATE_FORMAT(p.end_date, '%Y-%m-%d') AS `end` " +
            "FROM project_members pm " +
            "JOIN projects p ON p.project_id = pm.project_id " +
            "WHERE pm.employee_id = ? " +
            "ORDER BY p.start_date, p.project_id",
            [employeeId]
        );
        // role 은 비어 있을 수 있다(NULL). ?? 는 NULL/undefined 일 때만 기본값 "참여"로 바꾼다.
        res.json({ ok: true, projects: rows.map((r) => ({ ...r, role: r.role ?? "참여" })) });
    } catch (err) {
        console.error("내 프로젝트 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내 담당 업무 목록 (마이페이지 "내 업무" 탭 + 위쪽 "진행 중 업무" 카드)
// 주소 예: /api/my-tasks?employeeId=21
router.get("/my-tasks", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // task_status 는 ENUM('예정','대기','진행 중','완료') 이고 "진행 중"에는 띄어쓰기가 있다. 화면 코드의 비교 글자와 같다.
        const [rows] = await pool.query(
            "SELECT task_id AS id, task_title AS title, task_status AS status " +
            "FROM employee_tasks WHERE employee_id = ? " +
            "ORDER BY task_end_date, task_id",
            [employeeId]
        );
        res.json({ ok: true, tasks: rows });
    } catch (err) {
        console.error("내 업무 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내가 등록한 이슈 목록 (마이페이지 "내 활동" 탭)
// 주소 예: /api/my-issues?employeeId=37
// reporter_id = 이슈를 "등록한 사람". (assigned_employee_id 는 "담당자"라서 내가 등록한 것과 다르다)
router.get("/my-issues", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // AS: DB 칸 이름을 화면이 쓰는 이름(id, title, status, date)으로 바꾼다
        // DATE_FORMAT: 날짜 글자 "2026-10-26"으로 (시간대 때문에 날짜가 밀리는 문제 방지)
        // ORDER BY issue_created_at DESC: 최근에 만든 이슈가 위로
        const [rows] = await pool.query(
            "SELECT issue_id AS id, issue_title AS title, issue_status AS status, " +
            "DATE_FORMAT(issue_created_at, '%Y-%m-%d') AS `date` " +
            "FROM issues WHERE reporter_id = ? " +
            "ORDER BY issue_created_at DESC, issue_id DESC",
            [employeeId]
        );
        res.json({ ok: true, issues: rows });
    } catch (err) {
        console.error("내 이슈 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내가 등록한 공지 목록 (마이페이지 "내 활동" 탭)
// 주소 예: /api/my-notices?employeeId=37
// notices.employee_id = 공지를 쓴 사람(작성자)
router.get("/my-notices", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // 정렬: 고정 공지(is_pinned=1)를 맨 위로, 같은 묶음 안에서는 최신순.
        // 쉼표 앞이 1순위라서 순서를 바꾸면 고정이 무의미해진다.
        //sql 부분 "ORDER BY is_pinned DESC, created_at DESC, notice_id DESC"
        // 상단 고정(is_pinned)된 공지가 먼저, 그다음 최근 순
        const [rows] = await pool.query(
            "SELECT notice_id AS id, title, DATE_FORMAT(created_at, '%Y-%m-%d') AS `date`, is_pinned AS pinned " +
            "FROM notices WHERE employee_id = ? " +
            "ORDER BY is_pinned DESC, created_at DESC, notice_id DESC",
            [employeeId]
        );

        // is_pinned 는 tinyint(1) 라서 숫자 0/1 로 온다. 화면에서 쓰기 편하게 true/false 로 바꾼다.
        // ...r 로 나머지 항목은 그대로 복사하고, pinned만 덮어쓴다.
        res.json({ ok: true, notices: rows.map((r) => ({ ...r, pinned: Boolean(r.pinned) })) });
    } catch (err) {
        console.error("내 공지 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 이번 주 근무 시간(월~금)과 올해 총 연차 (마이페이지 "근태·휴가" 탭)
// 주소 예: /api/my-attendance?employeeId=37
// attendance_records: 직원별·날짜별 출근/퇴근 시각 / leave_balances: 직원별·연도별 총 연차
router.get("/my-attendance", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // WEEKDAY(날짜): 월요일=0 … 일요일=6. 오늘이 며칠 지났는지 빼면 "이번 주 월요일"이 된다.
        // TIMEDIFF(퇴근, 출근): 두 시각의 차이.
        // 퇴근 시각이 비어 있을 때(NULL): "오늘"이면 아직 근무 중이라 지금 시각(CURTIME)으로 계산하고,
        // "지난 날"이면 퇴근 기록이 빠진 날이라 출근=퇴근으로 두어 0시간으로 계산한다. (어제 기록을 지금 시각으로 계산하면 틀려요)
        // - 1: 점심 1시간 제외. GREATEST(…, 0): 마이너스가 되지 않게 0으로 막는다.
        const [rows] = await pool.query(
            "SELECT WEEKDAY(work_date) AS wd, " +
            "ROUND(GREATEST(TIME_TO_SEC(TIMEDIFF(COALESCE(check_out, IF(work_date = CURDATE(), CURTIME(), check_in)), check_in)) / 3600 - 1, 0), 1) AS hours " +
            "FROM attendance_records " +
            "WHERE employee_id = ? " +
            "AND work_date BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) " +
            "AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 4 DAY)",
            [employeeId]
        );
        // 월~금 5칸을 항상 만들고, 기록이 있는 요일만 시간을 채운다 (없으면 0)
        const dayNames = ["월", "화", "수", "목", "금"];
        const weekHours = dayNames.map((day, i) => {
            const found = rows.find((r) => r.wd === i);
            return { day, hours: found ? Number(found.hours) : 0 };
        });

        // 올해 총 연차. 아직 안 넣은 직원은 기본 15일로 (?? : 값이 null/undefined 일 때만 오른쪽 값을 쓴다)
        const [balances] = await pool.query(
            "SELECT total_days FROM leave_balances WHERE employee_id = ? AND balance_year = YEAR(CURDATE())",
            [employeeId]
        );
        //첫 번째 행이 있으면 그 행의 total_days를 꺼내고, 첫 번째 행이 없으면 undefined로 멈춘다.
        //  undefined면 15를 쓰고, 마지막에 숫자로 바꿔 leaveTotal에 담는다.
        const leaveTotal = Number(balances[0]?.total_days ?? 15);

        res.json({ ok: true, weekHours, leaveTotal });
    } catch (err) {
        console.error("근태 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

module.exports = router;
