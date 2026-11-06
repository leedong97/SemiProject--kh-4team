// 쇼핑몰 고객: 일반 회원가입 / 로그인 / 내 정보  (prefix: /api/shop/auth)
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../../db");
const { createShopToken, requireShopAuth } = require("../../../middleware/shopSession");

const router = express.Router();

const NAME_MAX = 50;
const PW_MIN = 8;
const PW_MAX_BYTES = 72; // bcrypt 는 앞 72바이트만 사용
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9-]{9,13}$/;

// 존재하지 않는 이메일일 때도 bcrypt 시간을 비슷하게 맞추기 위한 가짜 해시
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

function str(v) { return typeof v === "string" ? v : ""; }

router.post("/signup", async (req, res) => {
    const body = req.body || {};
    const name = str(body.name).trim();
    const email = str(body.email).trim().toLowerCase();
    const phone = str(body.phone).trim();
    const password = str(body.password);

    if (!name || name.length > NAME_MAX) return res.status(400).json({ ok: false, message: `이름은 1~${NAME_MAX}자로 입력해 주세요.` });
    if (!EMAIL_PATTERN.test(email) || email.length > 200) return res.status(400).json({ ok: false, message: "이메일 형식이 올바르지 않아요." });
    if (phone && !PHONE_PATTERN.test(phone)) return res.status(400).json({ ok: false, message: "전화번호는 숫자와 - 만 사용해 주세요." });
    if (password.length < PW_MIN) return res.status(400).json({ ok: false, message: `비밀번호는 ${PW_MIN}자 이상이어야 해요.` });
    if (Buffer.byteLength(password, "utf8") > PW_MAX_BYTES) return res.status(400).json({ ok: false, message: "비밀번호가 너무 길어요." });

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            "INSERT INTO shop_members (member_name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
            [name, email, hash, phone || null]
        );
        res.status(201).json({ ok: true, memberId: result.insertId });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ ok: false, message: "이미 가입된 이메일이에요." });
        console.error("쇼핑몰 가입 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

router.post("/login", async (req, res) => {
    const body = req.body || {};
    const email = str(body.email).trim().toLowerCase();
    const password = str(body.password);
    if (!email || !password) return res.status(400).json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." });

    try {
        const [rows] = await pool.query(
            "SELECT member_id, member_name, email, phone, password_hash FROM shop_members WHERE email = ?", [email]);
        const row = rows[0];
        // 소셜 전용 계정(password_hash NULL)이거나 없는 이메일이어도 같은 방식으로 비교해 같은 메시지를 준다
        const ok = await bcrypt.compare(password, row && row.password_hash ? row.password_hash : DUMMY_HASH);
        if (!row || !row.password_hash || !ok) return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않아요." });

        const member = { memberId: row.member_id, name: row.member_name, email: row.email, phone: row.phone };
        res.json({ ok: true, member, shopToken: createShopToken(row.member_id) });
    } catch (err) {
        console.error("쇼핑몰 로그인 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

router.get("/me", requireShopAuth, (req, res) => {
    const m = req.member;
    res.json({ ok: true, member: { memberId: m.member_id, name: m.member_name, email: m.email, phone: m.phone } });
});

module.exports = router;
