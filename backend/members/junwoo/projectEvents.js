const express = require("express");
const { requireAuth } = require("../../middleware/session");

const router = express.Router();

// 현재 SSE에 연결된 브라우저
const clients = new Set();

// 프로젝트 변경 알림
// 관리자 담당자가 DB 저장 완료 후 호출할 함수
function notifyProjectsChanged() {
    for (const client of clients) {
        client.send("projects-changed", {});
    }
}

// GET /api/project-events
router.get("/", requireAuth, (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let closed = false;
    let heartbeat = null;
    let expiryTimer = null;

    const client = { send };

    function close() {
        if (closed) return;

        closed = true;
        clients.delete(client);

        clearInterval(heartbeat);
        clearTimeout(expiryTimer);

        if (!res.writableEnded && !res.destroyed) {
            res.end();
        }
    }

    function write(text) {
        if (closed) return;

        try {
            if (res.destroyed || res.writableEnded) {
                close();
                return;
            }

            // 연결이 느려 전송 버퍼가 쌓이면 연결을 종료한다.
            // 브라우저가 재연결하면서 최신 목록을 조회한다.
            if (!res.write(text)) {
                close();
            }
        } catch {
            close();
        }
    }

    function send(event, data) {
        write(
            `event: ${event}\n` +
            `data: ${JSON.stringify(data)}\n\n`
        );
    }

    res.on("close", close);
    res.on("error", close);

    clients.add(client);

    // 연결 유지용 신호. DB 조회나 목록 갱신은 하지 않는다.
    heartbeat = setInterval(() => {
        write(": heartbeat\n\n");
    }, 25000);

    // requireAuth가 검증한 토큰의 만료 시점에 연결 종료
    const token = req.headers.authorization.slice(7);
    const payload = JSON.parse(
        Buffer.from(token.split(".")[0], "base64url").toString("utf8")
    );

    expiryTimer = setTimeout(
        close,
        Math.max(0, payload.exp - Date.now())
    );

    // 연결·재연결 직후 최신 목록을 조회하도록 알림
    send("ready", {});
});

module.exports = {
    router,
    notifyProjectsChanged
};