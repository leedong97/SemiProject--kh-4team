// 4조 ERP 백엔드 서버 (Express + MySQL)
// 흐름: React(3000) → axios → 이 서버(3333) → mysql2 → MySQL(mydb_v3)
// 왜 서버가 필요한가요? 비밀번호 같은 DB 접속 정보를 브라우저(React 코드)에 두면 누구나 볼 수 있어서,
// DB 접속은 서버에서만 해요.

// .env 파일의 값(DB 비밀번호 등)을 process.env 로 읽어와요
// .env 는 프로젝트 맨 바깥(backend 폴더의 한 칸 위)에 있어요.
// __dirname = 이 server.js 가 있는 폴더라서, 터미널을 어느 폴더에서 실행해도 같은 .env 를 찾아요.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // promise 버전: async/await 로 쓸 수 있어요
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); // React 개발 서버만 허용
app.use(express.json()); // 요청 본문(JSON)을 req.body 로 읽게 해 줘요

// 연결 풀(pool): 연결을 여러 개 만들어 두고 돌려 써요. (연결 하나가 끊겨도 서버가 안 죽어요)
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD, // .env 에서만 읽어요. 코드에 직접 쓰지 않아요
    database: process.env.DB_NAME || "mydb_v3",
    waitForConnections: true,
    connectionLimit: 5,
});

// 1) 연결 확인용: 브라우저에서 http://localhost:3333/api/health 를 열어 보세요
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS employees FROM employees");
        res.json({ ok: true, employees: rows[0].employees });
    } catch (err) {
        console.error("DB 연결 오류:", err.code, err.message);
        res.status(500).json({ ok: false, code: err.code, message: err.message });
    }
});

// 2) 로그인: { email, password } 를 받아서 bcrypt 로 비교해요
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." });
    }
    try {
        // ? 자리에 값을 따로 넘기면 SQL 인젝션(입력으로 SQL을 바꿔치기하는 공격)을 막아 줘요
        const [rows] = await pool.query(
            "SELECT employee_id, employee_code, employee_name, employee_division, employee_team, " +
            "employee_position, employee_grade, employee_role, employee_status, employee_pw " +
            "FROM employees WHERE employee_email = ?",
            [email]
        );
        const emp = rows[0];
        // 이메일이 없어도, 비밀번호가 틀려도 같은 메시지로 답해요 (어느 쪽이 틀렸는지 알려 주지 않기)
        const same = emp ? await bcrypt.compare(password, emp.employee_pw) : false;
        if (!same) {
            return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 맞지 않아요." });
        }
        if (emp.employee_status !== "재직") {
            return res.status(403).json({ ok: false, message: "재직 중인 직원만 로그인할 수 있어요." });
        }
        delete emp.employee_pw; // 비밀번호 해시는 화면으로 보내지 않아요
        res.json({ ok: true, user: emp });
    } catch (err) {
        console.error("로그인 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 3) 직원 한 명의 일정 목록: GET /api/schedules?employeeId=1
// 날짜는 DATE_FORMAT 으로 "2026-10-22" 글자로 바꿔서 보내요.
// (그냥 보내면 JS 날짜 객체가 되어 시간대 때문에 하루가 밀릴 수 있어요)
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
        // 시간이 없는 일정(휴가 등)은 NULL 대신 빈 글자로 맞춰요 (화면 쪽 정렬이 안 터지게)
        res.json({ ok: true, schedules: rows.map((r) => ({ ...r, time: r.time || "" })) });
    } catch (err) {
        console.error("일정 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

const PORT = Number(process.env.PORT) || 3333; // React(3000)와 겹치지 않게 3333
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
