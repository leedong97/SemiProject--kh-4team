// ===== 마이페이지 탭에 쓰는 조회 API 모음 =====
// /api/leaves, /api/my-projects, /api/my-tasks, /api/my-issues, /api/my-notices, /api/my-attendance
// 앞부분 "/api" 는 woojin/index.js 에서 붙여 준다.
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();
const pool = require("../../db");
const { requireAuth } = require("../../middleware/session");

// ===== 연차 일수 계산 규칙 (한 곳에서만 정의해서 목록·검사·합계가 같은 결과를 내게 한다) =====
// 토·일은 연차로 세지 않는다. (공휴일 테이블은 아직 없어서 공휴일은 평일로 센다)
// "2026-11-09" 글자를 UTC 기준으로 하루씩 넘기며 요일을 본다. (new Date("...")는 UTC 자정이라 getUTCDay()를 써야 시간대로 안 밀린다)
function countWorkdays(start, end, type) {
    if (type === "반차") return 0.5;
    let days = 0;
    for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
        const dow = new Date(t).getUTCDay(); // 0=일, 6=토
        if (dow !== 0 && dow !== 6) days += 1;
    }
    return days;
}

// ===== 연차 이월 계산 =====
// 총 연차(그 해) = 그 해 기본 연차 + 작년까지 쓰고 남은 연차(전부 이월, 상한 없음)
// 작년 남은 연차 = 작년 기본 + 재작년에서 넘어온 연차 - 작년에 쓴 연차(승인+대기)  <- 해마다 앞 해에서 이어 계산해요
// db 는 pool 이든 conn 이든 .query 만 있으면 돼요.
// 기록이 시작되는 해는 leave_balances 에 줄이 처음 생긴 해예요. 그 이전엔 넘어올 연차가 없다고 봐요.
// 줄이 빠진 해는 기본 15일로 계산해요 (기존 규칙과 같아요).
async function getLeaveTotal(db, employeeId, year) {
    const [balRows] = await db.query(
        "SELECT balance_year AS y, total_days FROM leave_balances WHERE employee_id = ? AND balance_year <= ? ORDER BY balance_year",
        [employeeId, year]
    );
    const baseByYear = new Map(balRows.map((r) => [Number(r.y), Number(r.total_days)]));
    const base = baseByYear.get(year) ?? 15;
    if (balRows.length === 0 || Number(balRows[0].y) >= year) return { base, carry: 0, total: base };

    const [usedRows] = await db.query(
        "SELECT YEAR(start_date) AS y, leave_type AS `type`, DATE_FORMAT(start_date, '%Y-%m-%d') AS `start`, DATE_FORMAT(end_date, '%Y-%m-%d') AS `end` " +
        "FROM leave_requests WHERE employee_id = ? AND leave_type IN ('연차', '반차') AND status IN ('승인', '대기') AND YEAR(start_date) < ?",
        [employeeId, year]
    );
    const usedByYear = new Map();
    for (const r of usedRows) usedByYear.set(Number(r.y), (usedByYear.get(Number(r.y)) || 0) + countWorkdays(r.start, r.end, r.type));

    let carry = 0;
    for (let y = Number(balRows[0].y); y < year; y++) {
        const total = (baseByYear.get(y) ?? 15) + carry;
        carry = Math.max(0, total - (usedByYear.get(y) || 0)); // 마이너스로 넘어가지 않게 0 아래로는 안 내려가요
    }
    return { base, carry, total: base + carry };
}

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
            "leave_type AS `type`, status " +
            "FROM leave_requests WHERE employee_id = ? " +
            "ORDER BY start_date DESC",
            [employeeId]
        );
        // days는 DB가 아니라 countWorkdays로 계산한다 (주말 제외 규칙을 JS 한 곳에 두기 위해).
        // 병가·경조사도 days는 채워 주지만 화면에서는 연차·반차만 합산한다.
        res.json({ ok: true, leaves: rows.map((r) => ({ ...r, days: countWorkdays(r.start, r.end, r.type) })) });
    } catch (err) {
        console.error("휴가 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// ===== 휴가 신청 (본인 것만) =====
const LEAVE_TYPES = ["연차", "반차", "병가", "경조사"];
router.post("/leaves", requireAuth, async (req, res) => {
    const employeeId = req.user.employee_id;   // 로그인한 사람. 화면이 보낸 값은 쓰지 않는다
    const { leave_type, start_date, end_date, leave_reason } = req.body || {};
    const dateOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
    if (!LEAVE_TYPES.includes(leave_type) || !dateOk(start_date) || !dateOk(end_date) || start_date > end_date) {
        return res.status(400).json({ ok: false, message: "휴가 입력값을 확인하세요." });
    }
    if (leave_type === "반차" && start_date !== end_date) {
        return res.status(400).json({ ok: false, message: "반차는 하루만 신청할 수 있어요." });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        const [overlaps] = await conn.query(
            "SELECT leave_id FROM leave_requests WHERE employee_id = ? AND status <> '반려' AND start_date <= ? AND end_date >= ? LIMIT 1",
            [employeeId, end_date, start_date]
        );
        if (overlaps.length) {
            await conn.rollback();
            return res.status(409).json({ ok: false, message: "겹치는 휴가 신청이 있어요." });
        }
        // 연차·반차는 "남은 연차"보다 많이 신청할 수 없다.
        // 남은 연차 = 그 해 총 연차 - (승인 + 대기 중인 연차·반차 일수). 반려는 세지 않는다.
        // 화면에서도 막지만, 화면은 우회할 수 있어서 서버가 한 번 더 검사한다.
        if (leave_type === "연차" || leave_type === "반차") {
            if (start_date.slice(0, 4) !== end_date.slice(0, 4)) {
                await conn.rollback();
                return res.status(400).json({ ok: false, message: "연차는 해가 바뀌는 기간을 한 번에 신청할 수 없어요. 연도별로 나눠 신청해 주세요." });
            }
            const requestDays = countWorkdays(start_date, end_date, leave_type);
            if (requestDays === 0) {
                await conn.rollback();
                return res.status(400).json({ ok: false, message: "토·일만 선택하셨어요. 평일이 포함된 기간을 골라 주세요." });
            }
            const leaveYear = Number(start_date.slice(0, 4));
            // 그 해 총 연차 = 기본 연차 + 작년에서 넘어온 연차
            const { total } = await getLeaveTotal(conn, employeeId, leaveYear);
            // 이미 쓴/대기 중인 신청의 시작·종료일을 가져와서 같은 규칙(countWorkdays)으로 더한다
            const [usedRows] = await conn.query(
                "SELECT leave_type AS `type`, DATE_FORMAT(start_date, '%Y-%m-%d') AS `start`, DATE_FORMAT(end_date, '%Y-%m-%d') AS `end` " +
                "FROM leave_requests WHERE employee_id = ? AND leave_type IN ('연차', '반차') " +
                "AND status IN ('승인', '대기') AND YEAR(start_date) = ?",
                [employeeId, leaveYear]
            );
            const used = usedRows.reduce((sum, r) => sum + countWorkdays(r.start, r.end, r.type), 0);
            const remain = total - used;
            if (requestDays > remain) {
                await conn.rollback();
                return res.status(400).json({ ok: false, message: `남은 연차(${remain}일)보다 많이 신청할 수 없어요. (신청 ${requestDays}일)` });
            }
        }
        const [result] = await conn.query(
            "INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, leave_reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '대기', NOW(), NOW())",
            [employeeId, leave_type, start_date, end_date, leave_reason || null]
        );
        await conn.commit();
        res.status(201).json({ ok: true, leave_id: result.insertId, status: "대기" });
    } catch (err) {
        // rollback 자체가 실패(연결 끊김 등)해도 원래 에러 로그와 500 응답은 나가야 해서 한 번 더 감싼다
        try { if (conn) await conn.rollback(); } catch (rbErr) { console.error("롤백 실패:", rbErr.message); }
        console.error("휴가 신청 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    } finally {
        if (conn) conn.release();
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

// 내가 "담당자(책임자)"인 프로젝트 목록 (마이페이지 "내 업무" 탭의 직원 평가 바로가기에 쓴다)
// 주소 예: /api/my-managed-projects?employeeId=21
// 담당자 기준: projects.manager_id = 내 직원번호.
// (참여자 명단 project_members 와는 별개라서 따로 조회한다. 담당자가 명단에 없을 수도 있어서다.)
router.get("/my-managed-projects", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT project_id AS id, project_title AS name, status, project_progress AS progress, " +
            "DATE_FORMAT(start_date, '%Y-%m-%d') AS `start`, DATE_FORMAT(end_date, '%Y-%m-%d') AS `end` " +
            "FROM projects WHERE manager_id = ? " +
            "ORDER BY start_date, project_id",
            [employeeId]
        );
        res.json({ ok: true, projects: rows });
    } catch (err) {
        console.error("담당 프로젝트 조회 오류:", err.code, err.message);
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

        // 올해 총 연차 = 올해 기본(줄이 없으면 15일) + 작년에서 넘어온 연차(이월)
        const thisYear = new Date().getFullYear();
        const { total: leaveTotal, carry: leaveCarry } = await getLeaveTotal(pool, employeeId, thisYear);

        res.json({ ok: true, weekHours, leaveTotal, leaveCarry });
    } catch (err) {
        console.error("근태 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

module.exports = router;
