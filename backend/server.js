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

app.get("/api/projects", async (req, res) => {
    const sql = `
        SELECT
            p.project_id AS id,
            p.project_title AS name,
            c.customer_name AS customerName
        FROM projects p
        LEFT JOIN customers c
            ON p.customer_id = c.customer_id
        ORDER BY p.project_id
    `;

    try {
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("프로젝트 조회 실패:", err);
        res.status(500).json({ message: "프로젝트 조회 실패" });
    }
});


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