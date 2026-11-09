// ===== 알림 조회 · 읽음 처리 (/api/notifications) =====
// 알림을 "만드는" 일은 각 이벤트(프로젝트 상태 변경 등)가 하고, 이 파일은 "보여주기/읽음 표시"만 해요.
const express = require("express");
const router = express.Router();
const pool = require("../../db");
const bus = require("../../notifyBus");

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

// GET /api/notifications/stream?employeeId=1  → 실시간 연결(SSE). 연결을 끊지 않고 열어 둔 채로,
// 이 직원에게 새 알림이 생기는 순간에만 "notification" 신호를 한 줄 보내줘요. (목록 자체는 위 주소로 다시 가져와요)
router.get("/stream", (req, res) => {
    const employeeId = toPositiveInt(req.query.employeeId);
    if (employeeId === null) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",   // "이건 계속 이어지는 SSE 연결이에요"라는 표시
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",             // nginx 같은 중간 서버가 내용을 모아 두지 않게
    });
    res.write("retry: 5000\n\n"); // 끊기면 브라우저가 5초 뒤 자동으로 다시 연결해요

    // 알림 방송이 올 때, 내 번호일 때만 한 줄 보낸다
    const onNotification = (targetId) => {
        if (targetId === employeeId) {
            res.write("event: notification\ndata: new\n\n");
        }
    };
    bus.on("notification", onNotification);

    // 25초마다 "살아 있어요" 신호(주석 줄). 중간 장비(로드밸런서 등)가 조용한 연결을 끊지 않게 해줘요.
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

    // 화면을 닫거나 연결이 끊기면 뒷정리 (안 하면 듣는 귀와 타이머가 계속 쌓여요)
    req.on("close", () => {
        clearInterval(heartbeat);
        bus.off("notification", onNotification);
    });
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
