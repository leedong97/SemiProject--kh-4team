// 실행 위치와 상관없이 backend/.env 파일을 읽습니다.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const envPath = path.join(__dirname, ".env");

// 처음 실행할 때 .env가 없으면 DB 설정 양식을 생성합니다.
if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, [
        "DB_HOST=localhost",
        "DB_PORT=3306",
        "DB_USER=root",
        "DB_PASSWORD=",
        "DB_NAME=mydb_v3",
        "PORT=3333",
        ""
    ].join("\n"), { flag: "wx" });
    console.log("[설정 안내] backend/.env를 생성했습니다. DB_PASSWORD를 입력하세요.");
}

require("dotenv").config({ path: envPath });

// 로그인 보안 키가 없으면 안전한 랜덤 키를 생성하고 .env에 보관합니다.
// 기존 유효한 키는 유지하여 서버 재시작 후에도 로그인 토큰이 유지됩니다.
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    const secret = crypto.randomBytes(32).toString("hex");
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    const filtered = lines.filter(line => !/^\s*SESSION_SECRET\s*=/.test(line));
    filtered.push("SESSION_SECRET=" + secret);
    fs.writeFileSync(envPath, filtered.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
    process.env.SESSION_SECRET = secret;
    console.log("[보안 설정] SESSION_SECRET을 생성하여 backend/.env에 저장했습니다.");
}


const express = require("express");
const cors = require("cors");
const pool = require("./db");

// 기존 팀원 모듈을 모두 유지합니다.
const woojin = require("./members/woojin");
const heeseung = require("./members/heeseung");
const dong = require("./members/dong");
const junwoo = require("./members/junwoo");
const jongho = require("./members/jongho");

const members = [woojin, heeseung, dong, junwoo, jongho];
const app = express();
const PORT = Number(process.env.PORT) || 3333;

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 서버가 실제로 어떤 폴더에서 실행되는지 터미널에서 확인합니다.
console.log("[서버 파일]", __filename);
console.log("[실행 포트]", PORT);

// MySQL 연결 상태 확인
app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS ok");
        res.json({ ok: true, db: rows[0].ok === 1 });
    } catch (error) {
        console.error("[DB 연결 오류]", error);
        res.status(500).json({ ok: false, message: error.message });
    }
});

// 팀원별 API 라우터를 등록합니다. 기존 API는 삭제하지 않습니다.
members.forEach((member, index) => {
    const routes = member.routes || [];
    console.log(`[팀원 ${index + 1}] API ${routes.length}개`);

    routes.forEach(({ prefix, router }) => {
        console.log("[API 등록]", prefix);
        app.use(prefix, router);
    });
});

// /api 요청은 React 정적 파일로 보내지 않고 JSON 404를 반환합니다.
app.use("/api", (req, res) => {
    console.error("[API 경로 없음]", req.method, req.originalUrl);
    res.status(404).json({
        message: "API 경로를 찾을 수 없습니다: " + req.method + " " + req.originalUrl
    });
});

// 기존 React 빌드 파일 제공 기능 유지
const buildDir = path.join(__dirname, "build");
if (fs.existsSync(buildDir)) {
    app.use(express.static(buildDir));
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildDir, "index.html"));
    });
}

// 포트가 이미 사용 중이면 오류를 명확하게 표시합니다.
const server = app.listen(PORT, () => {
    console.log("[서버 실행 성공] http://localhost:" + PORT);
    console.log("[공지사항 API] http://localhost:" + PORT + "/api/notices");
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error("[포트 충돌] " + PORT + "번 포트를 다른 프로그램이 사용 중입니다.");
        console.error("Windows에서 netstat -ano | findstr :" + PORT + " 로 PID를 확인하세요.");
    } else {
        console.error("[서버 실행 오류]", error);
    }
    process.exitCode = 1;
});
