// ============================================================
// 병합 코드 구역 안내 (브랜치 출처 기준)
// 1. 공통 설정: woojin의 환경변수·DB 연결 방식을 기준으로 통합
// 2. woojin: 로그인·회원가입·일정·개인 정보 API 및 관련 함수
// 3. submain: 프로젝트·이슈 조회 API
// 4. 병합 시 추가: 미등록 API의 404 처리
// 5. submain: React 정적 파일 및 페이지 라우트
// 6. 공통 서버 시작: 병합 시 DB 확인 추가, 중복 listen 제거
// 브랜치 출처 표시이며 개별 코드의 실제 작성자를 증명하지는 않음.
// ============================================================

// ===== [공통 설정 시작 | woojin 기준] =====
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

// 서버 기본 설정
const express = require("express");

const cors = require("cors");

const mysql = require("mysql2/promise");

const bcrypt = require("bcryptjs");

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// DB 연결 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "mydb_v3",
    waitForConnections: true,
    connectionLimit: 5,
});

// ===== [공통 설정 끝] =====

// ===== [woojin 시작] =====
// 범위: health, login, schedules, leaves, my-projects, my-tasks,
//       my-issues, my-notices, my-attendance, profile, signup
// 아래 검증 상수·함수도 woojin 코드에 포함됩니다.

// 서버·DB 연결 확인
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS employees FROM employees");
        res.json({ ok: true, employees: rows[0].employees });
    } catch (err) {
        console.error("DB 연결 오류:", err.code, err.message);
        res.status(500).json({ ok: false, code: err.code, message: err.message });
    }
});

// 로그인 (비밀번호 암호화 비교)
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT employee_id, employee_code, employee_name, employee_division, employee_team, " +
            "employee_position, employee_grade, employee_role, employee_status, employee_pw " +
            "FROM employees WHERE employee_email = ?",
            [email]
        );
        const emp = rows[0];
        const same = emp ? await bcrypt.compare(password, emp.employee_pw) : false;
        if (!same) {
            return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 맞지 않아요." });
        }
        if (emp.employee_status !== "재직") {
            return res.status(403).json({ ok: false, message: "재직 중인 직원만 로그인할 수 있어요." });
        }
        delete emp.employee_pw;
        res.json({ ok: true, user: emp });
    } catch (err) {
        console.error("로그인 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 일정 목록 조회
app.get("/api/schedules", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT schedule_id AS id, schedule_title AS title, " +
            "DATE_FORMAT(schedule_start_date, '%Y-%m-%d') AS `start`, " +
            "DATE_FORMAT(schedule_end_date, '%Y-%m-%d') AS `end`, " +
            "TIME_FORMAT(schedule_time, '%H:%i') AS `time`, " +
            "schedule_type AS `type` " +
            "FROM schedules WHERE employee_id = ? " +
            "ORDER BY schedule_start_date, schedule_time",
            [employeeId]
        );

        res.json({ ok: true, schedules: rows.map((r) => ({ ...r, time: r.time || "" })) });
    } catch (err) {
        console.error("일정 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 일정 입력값 검사
const SCHEDULE_TITLE_MAX = 100;
const SCHEDULE_TYPES = ["개인", "업무", "휴가", "프로젝트"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function checkSchedule(body) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const start = typeof body.start === "string" ? body.start : "";
    const end = typeof body.end === "string" ? body.end : "";
    const time = typeof body.time === "string" ? body.time : "";
    const type = typeof body.type === "string" ? body.type : "";

    if (!title || title.length > SCHEDULE_TITLE_MAX) {
        return { message: `일정 제목은 1~${SCHEDULE_TITLE_MAX}자로 입력해 주세요.` };
    }
    if (!DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
        return { message: "날짜 형식이 올바르지 않아요." };
    }
    if (end < start) {
        return { message: "종료일은 시작일과 같거나 그 이후여야 해요." };
    }
    if (time !== "" && !TIME_PATTERN.test(time)) {
        return { message: "시간 형식이 올바르지 않아요." };
    }
    if (!SCHEDULE_TYPES.includes(type)) {
        return { message: "일정 종류가 올바르지 않아요." };
    }
    return { title, start, end, time, type };
}

// 일정 추가
app.post("/api/schedules", async (req, res) => {
    const body = req.body || {};
    const employeeId = Number(body.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    const data = checkSchedule(body);
    if (data.message) {
        return res.status(400).json({ ok: false, message: data.message });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO schedules (employee_id, schedule_title, schedule_start_date, schedule_end_date, schedule_time, schedule_type) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
            [employeeId, data.title, data.start, data.end, data.time || null, data.type]
        );
        res.status(201).json({ ok: true, id: result.insertId });
    } catch (err) {
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        console.error("일정 등록 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 일정 수정
app.put("/api/schedules/:id", async (req, res) => {
    const scheduleId = Number(req.params.id);
    const body = req.body || {};
    const employeeId = Number(body.employeeId);
    if (!Number.isInteger(scheduleId) || scheduleId <= 0 || !Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "일정 번호와 employeeId 가 필요해요." });
    }
    const data = checkSchedule(body);
    if (data.message) {
        return res.status(400).json({ ok: false, message: data.message });
    }

    try {
        const [result] = await pool.query(
            "UPDATE schedules SET schedule_title = ?, schedule_start_date = ?, schedule_end_date = ?, " +
            "schedule_time = ?, schedule_type = ? WHERE schedule_id = ? AND employee_id = ?",
            [data.title, data.start, data.end, data.time || null, data.type, scheduleId, employeeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "일정을 찾을 수 없어요." });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("일정 수정 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 일정 삭제
app.delete("/api/schedules/:id", async (req, res) => {
    const scheduleId = Number(req.params.id);
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(scheduleId) || scheduleId <= 0 || !Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "일정 번호와 employeeId 가 필요해요." });
    }

    try {
        const [result] = await pool.query(
            "DELETE FROM schedules WHERE schedule_id = ? AND employee_id = ?",
            [scheduleId, employeeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "일정을 찾을 수 없어요." });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("일정 삭제 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내 휴가 내역 조회
app.get("/api/leaves", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
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
        res.json({ ok: true, leaves: rows.map((r) => ({ ...r, days: Number(r.days) })) });
    } catch (err) {
        console.error("휴가 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내 프로젝트 조회
app.get("/api/my-projects", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
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
        res.json({ ok: true, projects: rows.map((r) => ({ ...r, role: r.role ?? "참여" })) });
    } catch (err) {
        console.error("내 프로젝트 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내 담당 업무 조회
app.get("/api/my-tasks", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
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

// 내 이슈 조회
app.get("/api/my-issues", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
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

// 내 공지 조회 (고정 공지 먼저)
app.get("/api/my-notices", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT notice_id AS id, title, DATE_FORMAT(created_at, '%Y-%m-%d') AS `date`, is_pinned AS pinned " +
            "FROM notices WHERE employee_id = ? " +
            "ORDER BY is_pinned DESC, created_at DESC, notice_id DESC",
            [employeeId]
        );
        res.json({ ok: true, notices: rows.map((r) => ({ ...r, pinned: Boolean(r.pinned) })) });
    } catch (err) {
        console.error("내 공지 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 이번 주 근무시간·총 연차 조회
app.get("/api/my-attendance", async (req, res) => {
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT WEEKDAY(work_date) AS wd, " +
            "ROUND(GREATEST(TIME_TO_SEC(TIMEDIFF(COALESCE(check_out, IF(work_date = CURDATE(), CURTIME(), check_in)), check_in)) / 3600 - 1, 0), 1) AS hours " +
            "FROM attendance_records " +
            "WHERE employee_id = ? " +
            "AND work_date BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) " +
            "AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 4 DAY)",
            [employeeId]
        );
        const dayNames = ["월", "화", "수", "목", "금"];
        const weekHours = dayNames.map((day, i) => {
            const found = rows.find((r) => r.wd === i);
            return { day, hours: found ? Number(found.hours) : 0 };
        });

        const [balances] = await pool.query(
            "SELECT total_days FROM leave_balances WHERE employee_id = ? AND balance_year = YEAR(CURDATE())",
            [employeeId]
        );
        const leaveTotal = Number(balances[0]?.total_days ?? 15);

        res.json({ ok: true, weekHours, leaveTotal });
    } catch (err) {
        console.error("근태 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 연락처 입력 정리
function normalizePhone(input) {
    const digits = String(input).replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(digits)) return null;
    return digits.length === 11
        ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
        : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
const MAX_ADDRESS_LENGTH = 100;

// 내 연락처·주소 조회
app.get("/api/profile", async (req, res) => {
    const employeeId = Number(req.query.employeeId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        const [rows] = await pool.query(
            "SELECT employee_phone AS phone, employee_address AS address FROM employees WHERE employee_id = ?",
            [employeeId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        res.json({ ok: true, phone: rows[0].phone || "", address: rows[0].address || "" });
    } catch (err) {
        console.error("연락처 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 내 연락처·주소 수정
app.put("/api/profile", async (req, res) => {
    const employeeId = Number(req.body.employeeId);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    const rawPhone = String(req.body.phone ?? "").trim();
    const address = String(req.body.address ?? "").trim();

    let phone = "";
    if (rawPhone !== "") {
        phone = normalizePhone(rawPhone);
        if (!phone) {
            return res.status(400).json({ ok: false, message: "전화번호 형식을 확인해 주세요. 예) 010-1234-5678" });
        }
    }
    if (address.length > MAX_ADDRESS_LENGTH) {
        return res.status(400).json({ ok: false, message: `주소는 ${MAX_ADDRESS_LENGTH}자 이하로 입력해 주세요.` });
    }

    try {
        const [result] = await pool.query(
            "UPDATE employees SET employee_phone = ?, employee_address = ? WHERE employee_id = ?",
            [phone, address, employeeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        res.json({ ok: true, phone, address });
    } catch (err) {
        console.error("연락처 저장 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 회원가입 입력 기준
const SIGNUP_NAME_MAX = 50;
const SIGNUP_PW_MIN = 8;
const SIGNUP_PW_MAX_BYTES = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 회원가입 (비밀번호 암호화 후 저장)
app.post("/api/signup", async (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || name.length > SIGNUP_NAME_MAX) {
        return res.status(400).json({ ok: false, message: `이름은 1~${SIGNUP_NAME_MAX}자로 입력해 주세요.` });
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
        return res.status(400).json({ ok: false, message: "이메일 형식이 올바르지 않아요." });
    }
    if (password.length < SIGNUP_PW_MIN) {
        return res.status(400).json({ ok: false, message: `비밀번호는 ${SIGNUP_PW_MIN}자 이상이어야 해요.` });
    }
    if (Buffer.byteLength(password, "utf8") > SIGNUP_PW_MAX_BYTES) {
        return res.status(400).json({ ok: false, message: "비밀번호가 너무 길어요." });
    }

    let conn;

    try {

        const hash = await bcrypt.hash(password, 10);

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [result] = await conn.query(
            "INSERT INTO employees (employee_name, employee_division, employee_team, employee_position, " +
            "employee_grade, employee_role, employee_status, employee_email, employee_hire_date, employee_pw) " +
            "VALUES (?, '미배정', '미배정', '미배정', '미배정', '일반 사용자', '재직', ?, CURDATE(), ?)",
            [name, email, hash]
        );

        const code = "EMP-" + String(result.insertId).padStart(3, "0");

        await conn.query("UPDATE employees SET employee_code = ? WHERE employee_id = ?", [code, result.insertId]);

        await conn.commit();
        res.status(201).json({ ok: true, message: "회원가입이 완료되었어요." });

    } catch (err) {
        if (conn) {
            try { await conn.rollback(); } catch (e) { }
        }
        if (err.code === "ER_DUP_ENTRY" && /employee_email/.test(err.sqlMessage || err.message || "")) {
            return res.status(409).json({ ok: false, message: "이미 가입된 이메일이에요." });
        }
        console.error("회원가입 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });

    } finally {

        if (conn) conn.release();
    }
});

// ===== [woojin 끝] =====

// ===== [submain API 시작] =====
// 범위: GET /api/projects, GET /api/issues
// 병합 변경: SQL과 응답은 유지하고 db.query 콜백을 공통 pool의 await 방식으로 변경.

// GET /api/projects는 아래 [홍준우에서 추가] 구역에서 양쪽 응답 항목을 합쳐 등록합니다.


// =====================================================
// 이슈 조회 API
// =====================================================
app.get("/api/issues", async (req, res) => {
    const sql = `
        SELECT
            i.issue_id AS id,
            i.project_id AS projectId,
            i.issue_title AS title,
            i.issue_description AS description,
            i.issue_priority AS priority,
            i.issue_status AS status,
            i.issue_created_at AS createdAt,

            e.employee_id AS reporterId,
            e.employee_name AS reporterName,
            e.employee_grade AS reporterGrade,
            e.employee_phone AS reporterPhone,

            p.project_title AS projectName,
            c.customer_name AS customerName

        FROM issues i

        LEFT JOIN employees e
            ON i.reporter_id = e.employee_id

        LEFT JOIN projects p
            ON i.project_id = p.project_id

        LEFT JOIN customers c
            ON p.customer_id = c.customer_id

        ORDER BY i.issue_id
    `;

    try {
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("이슈 조회 실패:", err);
        res.status(500).json({ message: "이슈 조회 실패" });
    }
});


// =====================================================

// ===== [submain API 끝] =====

// ============================================================
// ===== [홍준우에서 추가 시작 | hongjunwoo · 전체 API] =====
// DB 호출은 첫 번째 파일의 공통 pool 사용.
// 루트 / 는 React 화면 제공을 유지하기 위해 추가하지 않음.
// 조회·등록·수정·삭제·조회수·상단 고정 API를 모두 포함.
// 대시보드의 임시 employeeId = 1은 전달받은 원본 그대로 유지.
// ============================================================
app.get('/api/db-check', async (req, res) => {

    try {
        const [rows] = await pool.query(
            'SELECT 1 AS connected'
        );

        res.json({
            message: 'MySQL 연결 성공!',
            connected: rows[0].connected === 1
        });

    } catch (error) {
        console.error('DB 연결 오류:', error);

        res.status(500).json({
            message: 'MySQL 연결 실패'
        });
    }

});

app.get('/api/dashboard/schedules', async (req, res) => {

    // 임시 직원번호 (추후 로그인 정보 연결)
    const employeeId = 1;

    try {

        /* 1. 직원 개인 일정 */
        const [scheduleRows] = await pool.query(`
            SELECT
                schedule_title AS title,
                DATE_FORMAT(
                    schedule_start_date,
                    '%Y-%m-%d'
                ) AS date,
                COALESCE(
                    TIME_FORMAT(schedule_time, '%H:%i'),
                    ''
                ) AS time,
                schedule_type AS type
            FROM schedules
            WHERE employee_id = ?
        `, [employeeId]);


        /* 2. 프로젝트 시작일 */
        const [projectStartRows] = await pool.query(`
            SELECT
            project_id AS projectId,
                CASE
                    WHEN start_date = end_date
                    THEN CONCAT('[프로젝트] ', project_title)
                    ELSE CONCAT('[프로젝트 시작] ', project_title)
                END AS title,

                DATE_FORMAT(
                    start_date,
                    '%Y-%m-%d'
                ) AS date,

                '' AS time,
                '프로젝트' AS type

            FROM projects
            WHERE start_date IS NOT NULL
        `);


        /* 3. 프로젝트 종료일 */
        const [projectEndRows] = await pool.query(`
            SELECT
            project_id AS projectId,
                CONCAT('[프로젝트 종료] ', project_title) AS title,

                DATE_FORMAT(
                    end_date,
                    '%Y-%m-%d'
                ) AS date,

                '' AS time,
                '프로젝트' AS type

            FROM projects
            WHERE end_date IS NOT NULL
            AND (
                start_date IS NULL
                OR end_date <> start_date
            )
        `);


        /* 공지사항 행사 일정 */
        const [noticeRows] = await pool.query(`
    SELECT
        notice_id AS noticeId,
        CONCAT('[공지사항] ', title) AS title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS date,
        '' AS time,
        '공지사항' AS type
    FROM notices
    WHERE event_date IS NOT NULL
`);

        console.log('MySQL 공지사항 일정:', noticeRows);

        /* 4. 모든 일정 합치기 */
        const allSchedules = [
            ...scheduleRows,
            ...projectStartRows,
            ...projectEndRows,
            ...noticeRows
        ];


        /* 5. 날짜 및 시간순 정렬 */
        allSchedules.sort((a, b) => {

            const dateCompare = a.date.localeCompare(b.date);

            if (dateCompare !== 0) {
                return dateCompare;
            }

            return a.time.localeCompare(b.time);

        });


        res.json(allSchedules);

    } catch (error) {

        console.error('통합 캘린더 조회 오류:', error);

        res.status(500).json({
            message: '캘린더 일정을 불러오지 못했습니다.'
        });

    }

});

app.get('/api/notices', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                n.notice_id AS id,
                n.title,
                n.content,
                COALESCE(e.employee_name, '알 수 없음') AS author,
                DATE_FORMAT(n.created_at, '%Y.%m.%d') AS date,
                n.views,
                n.is_pinned AS isPinned
            FROM notices n
            LEFT JOIN employees e
                ON n.employee_id = e.employee_id
            ORDER BY n.notice_id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error('공지사항 조회 오류:', error);

        res.status(500).json({
            message: '공지사항 조회 실패'
        });

    }

});

app.get('/api/notices/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const [rows] = await pool.query(`
            SELECT
                n.notice_id AS id,
                n.title,
                n.content,
                COALESCE(e.employee_name, '알 수 없음') AS author,
                DATE_FORMAT(n.created_at, '%Y.%m.%d') AS date,
                DATE_FORMAT(n.updated_at, '%Y.%m.%d %H:%i') AS updatedAt,
                n.views,
                n.is_pinned AS isPinned
            FROM notices n
            LEFT JOIN employees e
                ON n.employee_id = e.employee_id
            WHERE n.notice_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error('공지사항 상세 조회 오류:', error);

        res.status(500).json({
            message: '공지사항 상세 조회 실패'
        });

    }

});

// [공동 병합] submain의 id/name/customerName과 오름차순 정렬 유지.
// 홍준우의 title/content/작성자/담당자 등 조회 항목 추가.
app.get('/api/projects', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            
SELECT
    p.project_id AS id,
    p.project_title AS title,
    p.project_title AS name,
    c.customer_name AS customerName,
    p.project_content AS content,

    p.created_by AS authorId,
    COALESCE(a.employee_name, '직원 정보 없음') AS author,

    p.manager_id AS managerId,
    CASE
        WHEN p.manager_id IS NULL THEN '미지정'
        ELSE COALESCE(m.employee_name, '직원 정보 없음')
    END AS managerName,

    p.status,
    p.priority,
    p.project_progress AS progress,
    p.views,

    DATE_FORMAT(p.start_date, '%Y.%m.%d') AS startDate,
    DATE_FORMAT(p.end_date, '%Y.%m.%d') AS endDate,
    DATE_FORMAT(p.created_at, '%Y.%m.%d') AS date

FROM projects p
LEFT JOIN customers c ON p.customer_id = c.customer_id

LEFT JOIN employees a
    ON p.created_by = a.employee_id

LEFT JOIN employees m
    ON p.manager_id = m.employee_id

ORDER BY p.project_id

        `);

        res.json(rows);

    } catch (error) {

        console.error('프로젝트 조회 오류:', error);

        res.status(500).json({
            message: '프로젝트 조회 실패'
        });

    }

});

app.get('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [rows] = await pool.query(`
            
SELECT
    p.project_id AS id,
    p.project_title AS title,
    p.project_content AS content,

    p.created_by AS authorId,
    COALESCE(a.employee_name, '직원 정보 없음') AS author,

    p.manager_id AS managerId,
    CASE
        WHEN p.manager_id IS NULL THEN '미지정'
        ELSE COALESCE(m.employee_name, '직원 정보 없음')
    END AS managerName,

    p.status,
    p.priority,
    p.project_progress AS progress,
    p.views,

    DATE_FORMAT(p.start_date, '%Y.%m.%d') AS startDate,
    DATE_FORMAT(p.end_date, '%Y.%m.%d') AS endDate,
    DATE_FORMAT(p.created_at, '%Y.%m.%d') AS date,
    DATE_FORMAT(p.updated_at, '%Y.%m.%d %H:%i') AS updatedAt

FROM projects p

LEFT JOIN employees a
    ON p.created_by = a.employee_id

LEFT JOIN employees m
    ON p.manager_id = m.employee_id

WHERE p.project_id = ?

        `, [id]);


        if (rows.length === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        // 프로젝트 참여 직원 이름 조회
        const [memberRows] = await pool.query(`
    SELECT
        e.employee_name AS name
    FROM project_members pm
    JOIN employees e
        ON pm.employee_id = e.employee_id
    WHERE pm.project_id = ?
    ORDER BY pm.employee_id ASC
`, [id]);

        // 기존 프로젝트 정보 + 참여 직원 명단 반환
        res.json({
            ...rows[0],
            memberNames: memberRows.map(member => member.name)
        });


    } catch (error) {

        console.error('프로젝트 상세 조회 오류:', error);

        res.status(500).json({
            message: '프로젝트 상세 조회 실패'
        });

    }

});
// ----- [홍준우: 등록·수정·삭제·조회수·상단 고정] -----
app.post('/api/notices', async (req, res) => {

    const { title, content, employee_id, eventDate = null } = req.body;

    // 제목과 내용 공백 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 내용 글자 수 검사
    if (content.trim().length > 10000) {
        return res.status(400).json({
            message: '내용은 최대 10000자까지 입력할 수 있습니다.'
        });
    }


    /* 공지사항 행사일 검사 (선택사항) */
    if (eventDate !== null) {

        const date = new Date(`${eventDate}T00:00:00Z`);

        if (
            typeof eventDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== eventDate
        ) {
            return res.status(400).json({
                message: '올바른 행사일을 선택해주세요.'
            });
        }

    }


    try {


        const [result] = await pool.query(
            `INSERT INTO notices (
            title,
            content,
            employee_id,
            event_date
            )
                VALUES (?, ?, ?, ?)`,
            [
                title.trim(),
                content.trim(),
                employee_id,
                eventDate
            ]
        );


        res.status(201).json({
            message: '공지사항 등록 성공!',
            id: result.insertId
        });

    } catch (error) {

        console.error('공지사항 등록 오류:', error);

        res.status(500).json({
            message: '공지사항 등록 실패'
        });

    }

});

app.patch('/api/notices/:id/views', async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    try {

        const [result] = await pool.query(
            `UPDATE notices
             SET
                 views = COALESCE(views, 0) + 1,
                 updated_at = updated_at
             WHERE notice_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        const [rows] = await pool.query(
            'SELECT views FROM notices WHERE notice_id = ?',
            [id]
        );

        res.json({
            views: rows[0].views
        });

    } catch (error) {

        console.error('조회수 증가 오류:', error);

        res.status(500).json({
            message: '조회수 증가 실패'
        });

    }

});

app.delete('/api/notices/:id', async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    try {

        const [result] = await pool.query(
            'DELETE FROM notices WHERE notice_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: '공지사항 삭제 성공!'
        });

    } catch (error) {

        console.error('공지사항 삭제 오류:', error);

        res.status(500).json({
            message: '공지사항 삭제 실패'
        });

    }

});

app.put('/api/notices/:id', async (req, res) => {

    const id = Number(req.params.id);
    const { title, content, eventDate } = req.body;

    // 공지사항 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    // 제목과 내용 확인
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 내용 글자 수 검사
    if (content.trim().length > 10000) {
        return res.status(400).json({
            message: '내용은 최대 10000자까지 입력할 수 있습니다.'
        });
    }

    // 행사일 유효성 검사 (여기에 추가!)
    if (eventDate !== undefined && eventDate !== null) {
        const validDate =
            typeof eventDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(eventDate) &&
            !Number.isNaN(Date.parse(eventDate)) &&
            new Date(eventDate).toISOString().slice(0, 10) === eventDate;

        if (!validDate) {
            return res.status(400).json({
                message: "올바른 행사일을 선택해주세요."
            });
        }
    }

    try {


        const [result] = await pool.query(`
            UPDATE notices
                SET
                title = ?,
                content = ?,
                event_date = CASE
                WHEN ? = 1 THEN ?
                ELSE event_date
                END,
                updated_at = NOW()
                WHERE notice_id = ?
        `, [
            title.trim(),
            content.trim(),
            eventDate !== undefined ? 1 : 0,
            eventDate ?? null,
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: '공지사항 수정 성공!',
            id: id
        });

    } catch (error) {

        console.error('공지사항 수정 오류:', error);

        res.status(500).json({
            message: '공지사항 수정 실패'
        });

    }

});

app.patch('/api/notices/:id/pin', async (req, res) => {

    const id = Number(req.params.id);
    const { isPinned } = req.body;

    // 공지사항 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    // 고정 여부 확인
    if (typeof isPinned !== 'boolean') {
        return res.status(400).json({
            message: '고정 여부를 확인해주세요.'
        });
    }

    try {

        const [result] = await pool.query(`
            UPDATE notices
            SET
                is_pinned = ?,
                updated_at = NOW()
            WHERE notice_id = ?
        `, [isPinned ? 1 : 0, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: isPinned
                ? '공지사항 상단 고정 성공!'
                : '공지사항 상단 고정 해제!',
            id,
            isPinned
        });

    } catch (error) {

        console.error('공지사항 고정 오류:', error);

        res.status(500).json({
            message: '공지사항 고정 설정 실패'
        });

    }

});

app.patch('/api/projects/:id/views', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [result] = await pool.query(`
            UPDATE projects
            SET
                views = COALESCE(views, 0) + 1,
                updated_at = updated_at
            WHERE project_id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        const [rows] = await pool.query(
            'SELECT views FROM projects WHERE project_id = ?',
            [id]
        );

        res.json({
            views: rows[0].views
        });

    } catch (error) {

        console.error('프로젝트 조회수 증가 오류:', error);

        res.status(500).json({
            message: '프로젝트 조회수 증가 실패'
        });

    }

});

app.post('/api/projects', async (req, res) => {

    const {
        title,
        content,
        created_by,
        startDate,
        endDate,
        status,
        priority
    } = req.body;

    // 제목과 내용 공백 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '프로젝트 제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 작성자 번호 검사
    if (
        !Number.isSafeInteger(created_by) ||
        created_by <= 0
    ) {
        return res.status(400).json({
            message: '올바른 작성자 번호가 필요합니다.'
        });
    }


    // 프로젝트 일정 검사
    if (
        typeof startDate !== 'string' ||
        typeof endDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
        return res.status(400).json({
            message: '프로젝트 시작일과 종료일을 선택해주세요.'
        });
    }

    // 날짜 순서 검사
    if (endDate < startDate) {
        return res.status(400).json({
            message: '종료일은 시작일보다 빠를 수 없습니다.'
        });
    }

    if (!["예정", "진행중", "완료", "보류"].includes(status)) {
        return res.status(400).json({
            message: "올바른 프로젝트 상태를 선택하세요."
        });
    }

    if (!["낮음", "보통", "높음"].includes(priority)) {
        return res.status(400).json({
            message: "올바른 우선순위를 선택하세요."
        });
    }

    try {


        const [result] = await pool.query(`
    INSERT INTO projects (
        project_title,
        project_content,
        created_by,
        start_date,
        end_date,
        status,
        priority,
        project_progress,
        views
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
`, [
            title.trim(),
            content.trim(),
            created_by,
            startDate,
            endDate,
            status,
            priority
        ]);


        res.status(201).json({
            message: '프로젝트 등록 완료.',
            id: result.insertId
        });

    } catch (error) {

        console.error('프로젝트 등록 오류:', error);

        res.status(500).json({
            message: '프로젝트 등록 실패'
        });

    }

});

app.put('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    const {
        title,
        content,
        status,
        priority,
        progress,
        startDate,
        endDate
    } = req.body;

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    // 제목과 내용 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '프로젝트 제목과 내용을 입력하세요.'
        });
    }

    // 제목 길이 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 프로젝트 상태 검사
    const statusList = ['예정', '진행중', '완료', '보류'];

    if (
        status !== undefined &&
        !statusList.includes(status)
    ) {
        return res.status(400).json({
            message: '올바른 프로젝트 상태를 선택하세요.'
        });
    }

    // 우선순위 검사
    const priorityList = ['낮음', '보통', '높음'];

    if (
        priority !== undefined &&
        !priorityList.includes(priority)
    ) {
        return res.status(400).json({
            message: '올바른 우선순위를 선택하세요.'
        });
    }

    // 진행률 검사
    if (
        progress !== undefined &&
        (
            !Number.isInteger(progress) ||
            progress < 0 ||
            progress > 100
        )
    ) {
        return res.status(400).json({
            message: '진행률은 0~100 사이의 정수여야 합니다.'
        });
    }

    const validProjectDate = (value) =>
        value === undefined ||
        value === null ||
        (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value
        );

    if (!validProjectDate(startDate) || !validProjectDate(endDate)) {
        return res.status(400).json({
            message: "올바른 프로젝트 날짜를 입력해주세요."
        });
    }

    if (startDate && endDate && endDate < startDate) {
        return res.status(400).json({
            message: "종료일은 시작일보다 빠를 수 없습니다."
        });
    }

    try {


        const [result] = await pool.query(`
    UPDATE projects
    SET
        project_title = ?,
        project_content = ?,
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        project_progress = COALESCE(?, project_progress),
        start_date = CASE WHEN ? = 1 THEN ? ELSE start_date END,
        end_date = CASE WHEN ? = 1 THEN ? ELSE end_date END,
        updated_at = NOW()
    WHERE project_id = ?
`, [
            title.trim(),
            content.trim(),
            status ?? null,
            priority ?? null,
            progress ?? null,
            startDate !== undefined ? 1 : 0,
            startDate ?? null,
            endDate !== undefined ? 1 : 0,
            endDate ?? null,
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json({
            message: '프로젝트 수정 성공!',
            id
        });

    } catch (error) {

        console.error('프로젝트 수정 오류:', error);

        res.status(500).json({
            message: '프로젝트 수정 실패'
        });

    }

});

app.delete('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [result] = await pool.query(
            'DELETE FROM projects WHERE project_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json({
            message: '프로젝트 삭제 성공!'
        });

    } catch (error) {

        console.error('프로젝트 삭제 오류:', error);

        // 다른 테이블에서 프로젝트를 참조하는 경우
        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.code === 'ER_ROW_IS_REFERENCED'
        ) {
            return res.status(409).json({
                message: '참여자 또는 관련 데이터가 있어 프로젝트를 삭제할 수 없습니다.'
            });
        }

        res.status(500).json({
            message: '프로젝트 삭제 실패'
        });

    }

});

// ===== [홍준우에서 추가 끝] =====

// ===== [병합 시 추가한 공통 처리 시작] =====
// 등록되지 않은 API 요청 처리
app.use("/api", (req, res) => {
    res.status(404).json({ ok: false, message: "API를 찾을 수 없어요." });
});

// ===== [병합 시 추가한 공통 처리 끝] =====

// ===== [submain 화면 제공 시작] =====
// 병합 변경: 정적 파일 등록 중복 제거, 모든 API 아래로 배치.
// React 빌드 파일: backend/build 폴더 기준
const path = require("path");
app.use(express.static(path.join(__dirname, "build")));
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ===== [submain 화면 제공 끝] =====

// ===== [공통 서버 시작 | 병합 시 정리] =====
// 두 브랜치의 서버 실행을 하나로 통합. DB 연결 확인 후 시작하도록 변경.
// DB 연결 확인 후 서버를 한 번만 시작
const PORT = Number(process.env.PORT) || 3333;
async function start() {
    await pool.query("SELECT 1");
    app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
}
start().catch(async (err) => {
    console.error("서버 시작 실패:", err.code, err.message);
    await pool.end().catch(() => {});
    process.exitCode = 1;
});