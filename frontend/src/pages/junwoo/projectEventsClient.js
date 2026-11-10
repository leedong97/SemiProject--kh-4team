import { API_BASE } from "../../shared/config";

// 반환된 함수를 호출하면 연결과 재연결 예약을 정리한다.
export function connectProjectEvents(onRefresh) {
    let stopped = false;
    let controller = null;
    let retryTimer = null;
    let retryDelay = 1000;

    function handleEvent(block) {
        let eventName = "";

        for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
            }
        }

        // heartbeat는 무시한다.
        if (
            eventName === "ready" ||
            eventName === "projects-changed"
        ) {
            onRefresh();
        }
    }

    async function connect() {
        if (stopped) return;

        const token = localStorage.getItem("nexus_auth_token");

        // 로그인 전에는 SSE에 연결하지 않는다.
        if (!token) return;

        controller = new AbortController();

        let reader = null;
        let retry = true;

        try {
            const response = await fetch(
                `${API_BASE}/api/project-events`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "text/event-stream"
                    },
                    signal: controller.signal,
                    cache: "no-store"
                }
            );

            if (response.status === 401 || response.status === 403) {
                retry = false;
                throw new Error(
                    "프로젝트 실시간 연결 인증 실패: 다시 로그인해주세요."
                );
            }

            if (!response.ok || !response.body) {
                throw new Error("프로젝트 실시간 연결에 실패했습니다.");
            }

            if (
                !response.headers
                    .get("content-type")
                    ?.includes("text/event-stream")
            ) {
                throw new Error("SSE 응답 형식이 올바르지 않습니다.");
            }

            retryDelay = 1000;
            reader = response.body.getReader();

            const decoder = new TextDecoder();
            let buffer = "";

            while (!stopped) {
                const { value, done } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // projectEvents.js가 보내는 LF 빈 줄로 이벤트 구분.
                // 네트워크에서 이벤트가 여러 조각으로 와도 모아서 처리.
                let boundary = buffer.indexOf("\n\n");

                while (boundary !== -1) {
                    const block = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);

                    handleEvent(block);
                    boundary = buffer.indexOf("\n\n");
                }
            }
        } catch (error) {
            if (!stopped && error.name !== "AbortError") {
                console.error(error.message);
            }
        } finally {
            if (reader) {
                try {
                    await reader.cancel();
                } catch {
                    // 이미 종료된 연결
                }

                reader.releaseLock();
            }

            // 정상 연결 중에는 반복 요청하지 않는다.
            // 연결이 끊어진 경우에만 재연결한다.
            if (!stopped && retry) {
                retryTimer = window.setTimeout(connect, retryDelay);
                retryDelay = Math.min(retryDelay * 2, 30000);
            }
        }
    }

    connect();

    return function disconnect() {
        stopped = true;
        window.clearTimeout(retryTimer);
        controller?.abort();
    };
}