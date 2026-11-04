// 로그인 토큰 생성 및 검증 (Node.js 내장 crypto 사용)
const crypto = require("crypto");
const pool = require("../db");

function secret() {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
        throw new Error("AUTH_SECRET 환경변수를 32자 이상으로 설정하세요.");
    }
    return process.env.AUTH_SECRET;
}
function sign(data) {
    return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}
function createToken(employeeId) {
    const payload = Buffer.from(JSON.stringify({ id: employeeId, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
    return payload + "." + sign(payload);
}
async function requireAuth(req, res, next) {
    try {
        const value = req.headers.authorization || "";
        const token = value.startsWith("Bearer ") ? value.slice(7) : "";
        const parts = token.split(".");
        if (parts.length !== 2 || !parts[0] || !parts[1]) return res.status(401).json({ message: "로그인이 필요합니다." });
        const expected = Buffer.from(sign(parts[0]));
        const received = Buffer.from(parts[1]);
        if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
            return res.status(401).json({ message: "유효하지 않은 인증 정보입니다." });
        }
        const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        if (!Number.isInteger(data.id) || !Number.isFinite(data.exp) || data.exp < Date.now()) {
            return res.status(401).json({ message: "로그인이 만료되었습니다." });
        }
        const [rows] = await pool.query("SELECT employee_id, employee_role, employee_grade, employee_status FROM employees WHERE employee_id = ?", [data.id]);
        if (!rows[0] || rows[0].employee_status !== "재직") return res.status(403).json({ message: "사용할 수 없는 계정입니다." });
        req.user = rows[0];
        next();
    } catch (error) {
        console.error("인증 오류:", error.message);
        res.status(401).json({ message: "인증에 실패했습니다." });
    }
}
function requireManager(req, res, next) {
    if (req.user.employee_role !== "관리자") return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    next();
}
module.exports = { createToken, requireAuth, requireManager };
