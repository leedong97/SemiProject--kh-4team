// 쇼핑몰 고객: 일반 회원가입 / 로그인 / 구글 로그인 / 닉네임 / 내 정보  (prefix: /api/shop/auth)
const express = require("express");
const https = require("https");
const bcrypt = require("bcryptjs");
const pool = require("../../../db");
const { createShopToken, requireShopAuth } = require("../../../middleware/shopSession");

const router = express.Router();

const NAME_MAX = 50;
const PW_MIN = 8;
const PW_MAX_BYTES = 72; // bcrypt 는 앞 72바이트만 사용
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const PHONE_PATTERN = /^01[016789]-\d{3,4}-\d{4}$/; // 휴대폰: 010-1234-5678
const PHONE_RULE_TEXT = "전화번호는 010-1234-5678 형식으로 입력해 주세요.";
const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_]{2,12}$/; // 2~12자, 한글·영문·숫자·밑줄만
const NICKNAME_RULE_TEXT = "닉네임은 2~12자, 한글·영문·숫자·_ 만 쓸 수 있어요.";
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

// 존재하지 않는 이메일일 때도 bcrypt 시간을 비슷하게 맞추기 위한 가짜 해시
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

function str(v) { return typeof v === "string" ? v : ""; }

// 전화번호를 하나의 모양(010-1234-5678)으로 맞춘다. 01012345678 로 와도 같은 번호로 취급해야 중복을 잡을 수 있어요.
function normalizePhone(raw) {
    const text = String(raw || "").trim();
    const digits = text.replace(/\D/g, "");
    if (digits.length === 11) return digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
    if (digits.length === 10) return digits.slice(0, 3) + "-" + digits.slice(3, 6) + "-" + digits.slice(6);
    return text;
}

// DB 행 -> 화면에 돌려줄 회원 정보 (비밀번호 해시 같은 건 절대 넣지 않는다)
function memberView(row) {
    return { memberId: row.member_id, name: row.member_name, email: row.email, phone: row.phone, nickname: row.nickname || null };
}

// 닉네임 형식 검사: 문제가 있으면 안내 문구, 괜찮으면 빈 글자
function nicknameProblem(nickname) {
    return NICKNAME_PATTERN.test(nickname) ? "" : NICKNAME_RULE_TEXT;
}

// UNIQUE 위반(ER_DUP_ENTRY)이 어떤 칸(키) 때문인지 구분한다 (닉네임 / 이메일 / 전화번호)
// 에러 문구 안의 "값"이 아니라 "for key '...'" 의 키 이름만 보고 판단해요. (값에 nickname 같은 글자가 들어 있어도 안 속아요)
function isDuplicate(err, keyword) {
    if (!err || err.code !== "ER_DUP_ENTRY") return false;
    const message = String(err.sqlMessage || err.message || "");
    const match = message.match(/for key '([^']*)'/i);
    return (match ? match[1] : message).toLowerCase().includes(keyword);
}

// nickname 컬럼이 아직 없는 DB (sql/06_shop_nickname.sql 을 안 돌린 경우)
function isMissingNicknameColumn(err) {
    return err && err.code === "ER_BAD_FIELD_ERROR" && String(err.sqlMessage || err.message || "").includes("nickname");
}
const NEED_MIGRATION_MESSAGE = "서버 준비가 덜 됐어요. (DB에 sql/06_shop_nickname.sql 실행이 필요해요)";

function sendServerError(res, label, err) {
    if (isMissingNicknameColumn(err)) {
        console.error(label, "닉네임 컬럼이 없어요. sql/06_shop_nickname.sql 을 실행하세요.");
        return res.status(500).json({ ok: false, message: NEED_MIGRATION_MESSAGE });
    }
    console.error(label, err.code, err.message);
    return res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
}

// ---------------------------------------------------------------------
//  닉네임 중복 확인  GET /api/shop/auth/nickname-check?nickname=...
//  화면의 "중복확인" 버튼용이에요. (최종 보증은 DB 의 UNIQUE 키 -> 가입/저장할 때 한 번 더 막아요)
// ---------------------------------------------------------------------
router.get("/nickname-check", async (req, res) => {
    const nickname = str(req.query.nickname).trim();
    const problem = nicknameProblem(nickname);
    if (problem) return res.json({ ok: true, available: false, message: problem });
    try {
        const [rows] = await pool.query("SELECT 1 FROM shop_members WHERE nickname = ? LIMIT 1", [nickname]);
        if (rows.length > 0) return res.json({ ok: true, available: false, message: "이미 사용 중인 닉네임이에요." });
        res.json({ ok: true, available: true, message: "사용할 수 있는 닉네임이에요." });
    } catch (err) {
        sendServerError(res, "닉네임 확인 오류:", err);
    }
});

// ---------------------------------------------------------------------
//  전화번호 확인  GET /api/shop/auth/phone-check?phone=...
//  형식이 맞는지 + 이미 쓰는 번호인지 알려줘요. (최종 보증은 DB 의 UNIQUE 키)
// ---------------------------------------------------------------------
router.get("/phone-check", async (req, res) => {
    const phone = normalizePhone(str(req.query.phone));
    if (!PHONE_PATTERN.test(phone)) return res.json({ ok: true, available: false, message: PHONE_RULE_TEXT });
    try {
        const [rows] = await pool.query("SELECT 1 FROM shop_members WHERE phone = ? LIMIT 1", [phone]);
        if (rows.length > 0) return res.json({ ok: true, available: false, message: "이미 사용 중인 전화번호예요." });
        res.json({ ok: true, available: true, message: "사용할 수 있는 전화번호예요." });
    } catch (err) {
        sendServerError(res, "전화번호 확인 오류:", err);
    }
});

router.post("/signup", async (req, res) => {
    const body = req.body || {};
    const name = str(body.name).trim();
    const email = str(body.email).trim().toLowerCase();
    const phone = normalizePhone(str(body.phone));
    const nickname = str(body.nickname).trim();
    const password = str(body.password);

    if (!name || name.length > NAME_MAX) return res.status(400).json({ ok: false, message: `이름은 1~${NAME_MAX}자로 입력해 주세요.` });
    if (!EMAIL_PATTERN.test(email) || email.length > 200) return res.status(400).json({ ok: false, message: "이메일 형식이 올바르지 않아요." });
    if (nicknameProblem(nickname)) return res.status(400).json({ ok: false, message: NICKNAME_RULE_TEXT });
    if (phone && !PHONE_PATTERN.test(phone)) return res.status(400).json({ ok: false, message: PHONE_RULE_TEXT });
    if (password.length < PW_MIN) return res.status(400).json({ ok: false, message: `비밀번호는 ${PW_MIN}자 이상이어야 해요.` });
    if (Buffer.byteLength(password, "utf8") > PW_MAX_BYTES) return res.status(400).json({ ok: false, message: "비밀번호가 너무 길어요." });

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            "INSERT INTO shop_members (member_name, nickname, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)",
            [name, nickname, email, hash, phone || null]
        );
        res.status(201).json({ ok: true, memberId: result.insertId });
    } catch (err) {
        // 중복 확인 버튼을 누른 뒤 그 사이에 같은 닉네임을 다른 사람이 가져갈 수도 있어서, DB 가 한 번 더 막아 줘요
        if (isDuplicate(err, "nickname")) return res.status(409).json({ ok: false, message: "이미 사용 중인 닉네임이에요." });
        if (isDuplicate(err, "phone")) return res.status(409).json({ ok: false, message: "이미 사용 중인 전화번호예요." });
        if (isDuplicate(err, "email")) return res.status(409).json({ ok: false, message: "이미 가입된 이메일이에요." });
        sendServerError(res, "쇼핑몰 가입 오류:", err);
    }
});

router.post("/login", async (req, res) => {
    const body = req.body || {};
    const email = str(body.email).trim().toLowerCase();
    const password = str(body.password);
    if (!email || !password) return res.status(400).json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." });

    try {
        const [rows] = await pool.query(
            "SELECT member_id, member_name, nickname, email, phone, password_hash FROM shop_members WHERE email = ?", [email]);
        const row = rows[0];
        // 소셜 전용 계정(password_hash NULL)이거나 없는 이메일이어도 같은 방식으로 비교해 같은 메시지를 준다
        const ok = await bcrypt.compare(password, row && row.password_hash ? row.password_hash : DUMMY_HASH);
        if (!row || !row.password_hash || !ok) return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않아요." });

        // 닉네임이 아직 없는 옛 계정이면 화면이 닉네임 설정 단계를 보여줘요 (needsNickname)
        res.json({ ok: true, member: memberView(row), needsNickname: !row.nickname, shopToken: createShopToken(row.member_id) });
    } catch (err) {
        sendServerError(res, "쇼핑몰 로그인 오류:", err);
    }
});

// ---------------------------------------------------------------------
//  구글 로그인
//  흐름: 화면의 구글 버튼 -> 구글이 ID 토큰(credential)을 줌 -> 여기로 보냄
//        -> 구글에 "이 토큰 진짜야?" 확인 -> 우리 회원과 연결 -> 기존 로그인과 같은 응답
//  처음 가입한 구글 회원은 닉네임이 없어서 needsNickname: true 로 알려줘요 (화면이 닉네임을 받아 PATCH /nickname)
//  필요한 설정: 프로젝트 맨 위 .env 에  GOOGLE_CLIENT_ID=...  한 줄 (공개돼도 되는 값)
// ---------------------------------------------------------------------
function googleClientId() { return (process.env.GOOGLE_CLIENT_ID || "").trim(); }

// 구글이 서명·만료를 직접 검증해 주는 tokeninfo 주소 사용 (추가 패키지 설치 없음)
function verifyGoogleIdToken(idToken) {
    return new Promise((resolve, reject) => {
        const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
        const request = https.get(url, { timeout: 5000 }, (response) => {
            let raw = "";
            response.on("data", (chunk) => { raw += chunk; });
            response.on("end", () => {
                if (response.statusCode !== 200) {
                    return reject(Object.assign(new Error("유효하지 않은 구글 토큰"), { code: "BAD_GOOGLE_TOKEN" }));
                }
                try { resolve(JSON.parse(raw)); } catch (parseError) { reject(parseError); }
            });
        });
        request.on("timeout", () => request.destroy(new Error("구글 서버 응답 시간 초과")));
        request.on("error", reject);
    });
}

// 화면이 구글 버튼을 그릴 때 필요한 클라이언트 ID 를 알려준다 (비밀값이 아님). 없으면 null -> 화면이 버튼을 숨김
router.get("/google-config", (req, res) => {
    res.json({ ok: true, clientId: googleClientId() || null });
});

router.post("/google", async (req, res) => {
    const clientId = googleClientId();
    if (!clientId) return res.status(503).json({ ok: false, message: "구글 로그인이 아직 설정되지 않았어요." });

    const credential = str((req.body || {}).credential);
    if (!credential || credential.length > 4096) return res.status(400).json({ ok: false, message: "구글 로그인 정보가 올바르지 않아요." });

    let info;
    try {
        info = await verifyGoogleIdToken(credential);
    } catch (err) {
        if (err.code === "BAD_GOOGLE_TOKEN") return res.status(401).json({ ok: false, message: "구글 로그인 확인에 실패했어요. 다시 시도해 주세요." });
        console.error("구글 토큰 확인 오류:", err.message);
        return res.status(502).json({ ok: false, message: "구글 서버와 통신하지 못했어요. 잠시 후 다시 시도해 주세요." });
    }

    // 우리 앱(클라이언트 ID)용으로 발급된 토큰이고, 구글이 발급한 것인지 반드시 확인
    if (info.aud !== clientId || !GOOGLE_ISSUERS.includes(info.iss) || !info.sub) {
        return res.status(401).json({ ok: false, message: "구글 로그인 확인에 실패했어요." });
    }

    // 구글이 "확인된 이메일"이라고 한 경우에만 이메일을 믿는다
    const email = info.email && String(info.email_verified) === "true"
        ? String(info.email).trim().toLowerCase().slice(0, 200)
        : null;
    const name = (str(info.name).trim() || (email ? email.split("@")[0] : "구글 회원")).slice(0, NAME_MAX);

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        let memberId = null;
        // 1) 이미 구글로 연결된 회원인가 (shop_members.google_sub 에 구글 sub 가 저장돼 있는지)
        const [linked] = await conn.query(
            "SELECT member_id FROM shop_members WHERE google_sub = ?", [info.sub]);
        if (linked[0]) {
            memberId = linked[0].member_id;
        } else {
            // 2) 같은 이메일의 일반 회원이 있으면 그 계정에 구글을 연결 (google_sub 칸을 채움)
            if (email) {
                const [sameEmail] = await conn.query(
                    "SELECT member_id, google_sub FROM shop_members WHERE email = ?", [email]);
                if (sameEmail[0]) {
                    // 이미 다른 구글 계정이 연결된 회원이면 덮어쓰지 않고 막는다
                    if (sameEmail[0].google_sub) {
                        await conn.rollback();
                        return res.status(409).json({ ok: false, message: "이미 다른 구글 계정이 연결된 회원이에요." });
                    }
                    memberId = sameEmail[0].member_id;
                    await conn.query(
                        "UPDATE shop_members SET google_sub = ? WHERE member_id = ?", [info.sub, memberId]);
                }
            }
            // 3) 없으면 새 회원 만들기 (소셜 전용이라 비밀번호는 NULL, 닉네임은 다음 단계에서 받는다)
            if (memberId === null) {
                const [created] = await conn.query(
                    "INSERT INTO shop_members (member_name, email, password_hash, phone, google_sub) VALUES (?, ?, NULL, NULL, ?)",
                    [name, email, info.sub]);
                memberId = created.insertId;
            }
        }

        const [rows] = await conn.query(
            "SELECT member_id, member_name, nickname, email, phone FROM shop_members WHERE member_id = ?", [memberId]);
        await conn.commit();

        const row = rows[0];
        res.json({ ok: true, member: memberView(row), needsNickname: !row.nickname, shopToken: createShopToken(row.member_id) });
    } catch (err) {
        if (conn) { try { await conn.rollback(); } catch (rollbackError) { /* 무시 */ } }
        if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ ok: false, message: "처리 중 충돌이 났어요. 한 번 더 눌러 주세요." });
        sendServerError(res, "구글 로그인 오류:", err);
    } finally {
        if (conn) conn.release();
    }
});

// ---------------------------------------------------------------------
//  닉네임 설정  PATCH /api/shop/auth/nickname   body: { nickname }   (로그인 토큰 필요)
//  구글로 처음 들어온 회원 / 닉네임이 없는 옛 회원이 닉네임을 정할 때 써요
// ---------------------------------------------------------------------
router.patch("/nickname", requireShopAuth, async (req, res) => {
    const nickname = str((req.body || {}).nickname).trim();
    const problem = nicknameProblem(nickname);
    if (problem) return res.status(400).json({ ok: false, message: problem });
    try {
        await pool.query("UPDATE shop_members SET nickname = ? WHERE member_id = ?", [nickname, req.member.member_id]);
        const [rows] = await pool.query(
            "SELECT member_id, member_name, nickname, email, phone FROM shop_members WHERE member_id = ?", [req.member.member_id]);
        res.json({ ok: true, member: memberView(rows[0]) });
    } catch (err) {
        if (isDuplicate(err, "nickname")) return res.status(409).json({ ok: false, message: "이미 사용 중인 닉네임이에요." });
        sendServerError(res, "닉네임 저장 오류:", err);
    }
});

router.get("/me", requireShopAuth, (req, res) => {
    res.json({ ok: true, member: memberView(req.member), needsNickname: !req.member.nickname });
});

module.exports = router;
