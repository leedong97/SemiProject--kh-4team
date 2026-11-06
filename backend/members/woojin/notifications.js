// ===== 알림 조회 · 읽음 처리 (/api/notifications) =====
// 알림을 "만드는" 일은 각 이벤트(프로젝트 상태 변경 등)가 하고, 이 파일은 "보여주기/읽음 표시"만 해요.
const express = require("express");
const router = express.Router();
const pool = require("../../db");

// 한 번에 가져올 최대 알림 개수 (너무 많이 가져오면 느려져요)
const MAX_NOTIFICATIONS = 50;

// 화면이 보낸 값(글자)을 "1 이상의 정수"로 바꾼다. 아니면 null.
function toPositiveInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}
// GET /api/notifications?employeeId=1  → 이 직원의 알림 목록 (최신순)
router.get("/", async (req, res) => {
    const employeeId = toPositiveInt(req.query.employeeId);
    if (employeeId === null) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // DATE_FORMAT: 날짜를 '2026-11-03 09:30' 같은 글자로 바꿔서 시간대 문제 없이 그대로 보여준다.
        const [rows] = await pool.query(
            `SELECT notification_id AS id,
                    type,
                    message,
                    link,
                    is_read AS isRead,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS time
               FROM notifications
              WHERE employee_id = ?
              ORDER BY created_at DESC, notification_id DESC
              LIMIT ?`,
            [employeeId, MAX_NOTIFICATIONS]
        );
        // DB 의 0/1 을 true/false 로 바꿔서 화면(NotificationTab)이 쓰는 모양과 맞춘다.
        const notifications = rows.map((row) => ({ ...row, isRead: row.isRead === 1 }));
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        res.json({ ok: true, unreadCount, notifications });
    } catch (err) {
        console.error("알림 조회 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// PATCH /api/notifications/read-all  body: { employeeId }  → 내 알림 전부 읽음
router.patch("/read-all", async (req, res) => {
    const employeeId = toPositiveInt(req.body.employeeId);
    if (employeeId === null) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {
        // is_read = 0 인 것만 바꾼다 → 여러 번 눌러도 결과가 같다.
        const [result] = await pool.query(
            "UPDATE notifications SET is_read = 1 WHERE employee_id = ? AND is_read = 0",
            [employeeId]
        );
        res.json({ ok: true, changed: result.affectedRows });
    } catch (err) {
        console.error("알림 전체 읽음 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// PATCH /api/notifications/:id/read  body: { employeeId }  → 알림 하나 읽음
router.patch("/:id/read", async (req, res) => {
    const id = toPositiveInt(req.params.id);
    const employeeId = toPositiveInt(req.body.employeeId);
    if (id === null || employeeId === null) {
        return res.status(400).json({ ok: false, message: "id 와 employeeId 가 필요해요." });
    }
    try {
        // employee_id 조건도 함께 걸어서, 다른 사람의 알림을 읽음 처리하지 못하게 한다.
        const [result] = await pool.query(
            "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND employee_id = ?",
            [id, employeeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "알림을 찾을 수 없어요." });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("알림 읽음 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

module.exports = router;
