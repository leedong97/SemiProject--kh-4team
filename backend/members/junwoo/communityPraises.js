const express = require("express");
const db = require("../../db");

const {
    session,
    requireUser,
} = require("../dong/communitySession");

const router = express.Router();

// 기존 커뮤니티 로그인 인증 재사용
router.use(session, requireUser);

router.use(function (req, res, next) {
    res.set("Cache-Control", "no-store");
    next();
});

// 화면에서 사용할 칭찬 정보
const praiseSelect = `
    SELECT
        p.id,
        p.sender_id AS senderId,
        p.receiver_id AS receiverId,
        sender.employee_name AS sender,
        receiver.employee_name AS receiver,
        p.message,
        DATE_FORMAT(p.created_at, '%Y.%m.%d') AS date
    FROM community_praise p
    JOIN employees sender
        ON sender.employee_id = p.sender_id
    JOIN employees receiver
        ON receiver.employee_id = p.receiver_id
`;

// 최근 칭찬 3개 조회
router.get("/", async function (req, res, next) {
    try {
        const [rows] = await db.query(
            praiseSelect + `
                ORDER BY p.created_at DESC, p.id DESC
                LIMIT 3
            `
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// 칭찬받을 재직 직원 목록
router.get("/recipients", async function (req, res, next) {
    try {
        const [rows] = await db.query(
            `SELECT
                employee_id AS id,
                employee_name AS name,
                employee_team AS team,
                employee_code AS employeeCode
             FROM employees
             WHERE employee_status = '재직'
               AND employee_id <> ?
             ORDER BY employee_name, employee_id`,
            [req.communityUser.id]
        );

        res.json({
            recipients: rows,
            currentUser: req.communityUser,
        });
    } catch (error) {
        next(error);
    }
});

// 칭찬 등록
router.post("/", async function (req, res, next) {
    const body = req.body || {};

    const receiverId = Number(body.receiverId);
    const senderId = req.communityUser.id;

    const message =
        typeof body.message === "string"
            ? body.message.trim()
            : "";

    if (!Number.isSafeInteger(receiverId) || receiverId < 1) {
        return res.status(400).json({
            message: "칭찬받는 동료를 선택해주세요.",
        });
    }

    if (String(receiverId) === String(senderId)) {
        return res.status(400).json({
            message: "칭찬받는 다른 동료를 선택해주세요.",
        });
    }

    if (message.length < 1 || message.length > 200) {
        return res.status(400).json({
            message: "칭찬 내용은 1~200자로 입력해주세요.",
        });
    }

    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 실제 재직 중인 직원일 때만 등록
        const [result] = await connection.query(
            `INSERT INTO community_praise (
                sender_id,
                receiver_id,
                message
             )
             SELECT ?, employee_id, ?
             FROM employees
             WHERE employee_id = ?
               AND employee_status = '재직'`,
            [
                senderId,
                message,
                receiverId,
            ]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "칭찬받을 재직 직원을 찾지 못했습니다.",
            });
        }

        const [rows] = await connection.query(
            praiseSelect + " WHERE p.id = ?",
            [result.insertId]
        );

        if (rows.length !== 1) {
            throw new Error("등록된 칭찬 조회 실패");
        }

        await connection.commit();

        res.status(201).json({
            message: "칭찬이 등록되었습니다.",
            praise: rows[0],
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "칭찬 등록 취소 처리 오류:",
                    rollbackError.code
                );
            }
        }

        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 인증·조회·등록 오류 처리
router.use(function (error, req, res, next) {
    console.error(
        "칭찬함 처리 오류:",
        error.code || error.message
    );

    res.status(500).json({
        message: "칭찬함을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
});

module.exports = router;