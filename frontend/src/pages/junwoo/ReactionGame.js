import React, { useEffect, useRef, useState } from "react";
import "./ReactionGame.css";

const STORAGE_KEY = "community-reaction-best"

function readBest() {
    try {
        const value = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(value) && value > 0 ? value : null;
    } catch (error) {
        return null;
    }
}

function ReactionGame() {

    // idle : 시작 전, waiting : 대기, ready : 클릭, result : 결과, early : 실패
    const [status, setStatus] = useState("idle");
    const [record, setRecord] = useState(null);
    const [best, setBest] = useState(readBest);

    const timerRef = useRef(null);
    const startTimerRef = useRef(0);
    const phaseRef = useRef("idle");

    function changeStatus(nextStatus) {
        phaseRef.current = nextStatus;
        setStatus(nextStatus);
    }

    function clearTimer() {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }

    // 화면을 떠나거나 다른 탭으로 이동하면 진행 중인 게임 취소
    useEffect(function () {
        function handleVisibility() {
            if (
                document.hidden &&
                ["waiting", "ready"].includes(phaseRef.current)
            ) {
                clearTimer();
                phaseRef.current = "idle";
                setStatus("idle");
            }
        }

        document.addEventListener("visibilitychange", handleVisibility);

        return function () {
            clearTimer();
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );
        };

    }, []);

    function startGame() {
        clearTimer();
        setRecord(null);
        changeStatus("waiting");

        // 2~5초 사이에 초록색으로 변경
        const delay = 2000 + Math.random() * 3000;

        timerRef.current = setTimeout(function () {
            startTimerRef.current = performance.now();
            changeStatus("ready");
            timerRef.current = null;
        }, delay);
    }

    function handleGameClick() {
        const currentStatus = phaseRef.current;

        if (currentStatus === "waiting") {
            clearTimer();
            changeStatus("early");
            return;
        }

        if (currentStatus === "ready") {
            const elapsed = Math.max(
                1,
                Math.round(performance.now() - startTimerRef.current)
            );

            setRecord(elapsed);
            changeStatus("result");

            if (best === null || elapsed < best) {
                setBest(elapsed);

                try {
                    localStorage.setItem(STORAGE_KEY, String(elapsed));
                } catch {
                    // 저장할 수 없는 환경에서도 게임은 계속 진행
                }

            }

            return;

        }

        startGame();

    }

    function resetBest() {
        setBest(null);

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // 브라우저 저장소를 사용할 수 없으면 화면 기록만 초기화
        }

    }

    const messages = {
        idle: {
            title: "반응속도 도전",
            description: "클릭해서 시작하세요."
        },
        waiting: {
            title: "잠깐, 기다리세요!",
            description: "초록색으로 바뀌면 클릭!"
        },
        ready: {
            title: "지금 클릭!",
            description: "빠르게 눌러주세요."
        },
        result: {
            title: `${record} ms`,
            description: "클릭하면 다시 도전합니다."
        },
        early: {
            title: "너무 빨랐어요!",
            description: "클릭해서 다시 도전하세요."
        }
    };

    const message = messages[status];

    return (

        <section className="reaction-game" aria-label="반응속도 게임">
            <span className="reaction-game-label">잠깐 쉬어가기</span>
            <h2 className="reaction-game-title">⚡ 반응속도 테스트</h2>
            <p className="reaction-game-description">
                초록색으로 바뀌는 순간 눌러보세요.
            </p>

            <button type="button"
                className={`reaction-game-target reaction-game-${status}`}
                onClick={handleGameClick}
                onKeyDown={function (event) {
                    // 키를 누르고 있어 자동으로 반복 입력되는 것 방지
                    if (event.repeat) event.preventDefault();
                }}
            >
                <strong>{message.title}</strong>
                <span>{message.description}</span>
            </button>

            <div className="reaction-game-best" aria-live="polite">
                <span>이 브라우저 최고 기록</span>
                <strong>{best === null ? "-" : `${best} ms`}</strong>
            </div>

            <div className="reaction-game-footer">
                <span>숫자가 작을수록 빨라요!</span>
                <button type="button"
                    onClick={resetBest}
                    disabled={best === null}
                >
                    기록 초기화
                </button>
            </div>

        </section>

    );
}


export default ReactionGame;