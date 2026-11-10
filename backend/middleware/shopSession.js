// 쇼핑몰 고객 전용 토큰 (직원 토큰과 서명 키를 다르게 해서 서로 통하지 않게 한다)
const crypto = require("crypto");
const pool = require("../db");

function secret() {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
        throw new Error("AUTH_SECRET 환경변수를 32자 이상으로 설정하세요.");
    }
    // 같은 AUTH_SECRET 에서 고객용 키를 따로 만든다 (직원 토큰으로 고객 API, 반대도 불가)
    return crypto.createHmac("sha256", process.env.AUTH_SECRET).update("shop-token").digest();
}
function sign(data) {
    return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}
function createShopToken(memberId) {
    const payload = Buffer.from(JSON.stringify({ id: memberId, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
    return payload + "." + sign(payload);
}
async function requireShopAuth(req, res, next) {
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
        const [rows] = await pool.query("SELECT member_id, member_name, nickname, email, phone FROM shop_members WHERE member_id = ?", [data.id]);
        if (!rows[0]) return res.status(403).json({ message: "사용할 수 없는 계정입니다." });
        req.member = rows[0];
        next();
    } catch (error) {
        console.error("고객 인증 오류:", error.message);
        res.status(401).json({ message: "인증에 실패했습니다." });
    }
}
module.exports = { createShopToken, requireShopAuth };
