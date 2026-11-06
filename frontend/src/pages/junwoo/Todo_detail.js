import { API_BASE } from '../../shared/config';
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import getLoginUser from "../woojin/getLoginUser";

function Todo_detail({ todo = [], onViewTodo, onRequestCompletion }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pages, setPages] = useState(1);

    const viewedRequest = useRef({
        id: null,
        promise: null
    });

    // MySQL 프로젝트 상세 조회 + 조회수 증가
    useEffect(() => {
        const controller = new AbortController();

        const loadTodoDetail = async () => {
            setLoading(true);
            setError("");
            setItem(null);
            setPages(1);

            try {
                // 동일 프로젝트 조회수 중복 증가 방지
                if (viewedRequest.current.id !== id) {
                    viewedRequest.current = {
                        id,
                        promise: onViewTodo(Number(id)).catch(error => {
                            console.error("조회수 증가 오류:", error);
                        })
                    };
                }

                await viewedRequest.current.promise;
                if (controller.signal.aborted) return;

                const response = await fetch(
                    `${API_BASE}/api/projects/${id}`,
                    { signal: controller.signal }
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "프로젝트 상세 조회 실패");
                }

                setItem(data);
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("프로젝트 상세 조회 오류:", error);
                    setError(error.message);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        loadTodoDetail();
        return () => controller.abort();
    }, [id, onViewTodo]);

    // 담당자 이름
    const members = item?.memberNames ?? [];

    // 다른 프로젝트 목록 및 페이지네이션 (5개씩)
    const otherTodo = todo.filter(other => other.id !== Number(id));
    const totalPages = Math.ceil(otherTodo.length / 5);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 5;
    const end = start + 5;

    const [completionSaving, setCompletionSaving] = useState(false);
    const completionBusyRef = useRef(false);

    const loginUser = getLoginUser();

    const isProjectManager =
        !loginUser.isDummy &&
        item?.managerId != null &&
        String(item.managerId) === String(loginUser.id);

    const canRequestCompletion =
        isProjectManager &&
        item?.status === "진행중";

    let completionMessage = "";

    if (item?.status === "완료 요청") {
        completionMessage = "관리자 완료 승인을 기다리고 있습니다.";
    } else if (item?.status === "완료") {
        completionMessage = "완료된 프로젝트입니다.";
    } else if (loginUser.isDummy) {
        completionMessage = "로그인 후 이용해주세요.";
    } else if (item?.managerId == null) {
        completionMessage = "프로젝트 담당자가 배정되지 않았습니다.";
    } else if (!isProjectManager) {
        completionMessage = "프로젝트 담당자만 완료 요청할 수 있습니다.";
    } else if (item?.status !== "진행중") {
        completionMessage = "진행중인 프로젝트만 완료 요청할 수 있습니다.";
    } else {
        completionMessage =
            "완료 요청을 보내면 관리자가 확인한 뒤 완료 처리합니다.";
    }

    async function handleRequestCompletion() {
        if (completionBusyRef.current || !item) return;

        if (!canRequestCompletion) {
            alert(completionMessage);
            return;
        }

        if (!window.confirm(
            `"${item.title}" 프로젝트의 완료 승인을 요청할까요?`
        )) {
            return;
        }

        const targetId = item.id;

        completionBusyRef.current = true;
        setCompletionSaving(true);

        try {
            // DB 저장 및 공통 프로젝트 목록 갱신
            const data = await onRequestCompletion(targetId);

            // 현재 상세 화면도 갱신
            setItem(previous => {
                if (
                    !previous ||
                    String(previous.id) !== String(targetId)
                ) {
                    return previous;
                }

                return {
                    ...previous,
                    status: data.status
                };
            });

            alert("완료 요청이 접수되었습니다.");
        } catch (error) {
            alert(error.message || "완료 요청에 실패했습니다.");
        } finally {
            completionBusyRef.current = false;
            setCompletionSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="todo-page todo-detail-page">
                <h2>프로젝트를 불러오는 중입니다...</h2>
            </main>
        );
    }

    if (error || !item) {
        return (
            <main className="todo-page todo-detail-page">
                <h2>{error || "존재하지 않는 프로젝트입니다."}</h2>
                <button onClick={() => navigate("/todo")}>목록으로 돌아가기</button>
            </main>
        );
    }

    return (
        <main className="todo-page todo-detail-page">
            {/* 상세보기 상단 */}
            <div className="todo-detail-header">
                <div>
                    <h1>프로젝트 상세정보</h1>
                    <p>등록된 프로젝트의 내용을 확인할 수 있습니다.</p>
                </div>
                <button onClick={() => navigate("/todo")}>목록으로</button>
            </div>

            {/* 프로젝트 상세정보 (읽기 전용) */}
            <div className="todo-detail-content">
                <div className="todo-detail-row">
                    <strong>프로젝트 제목</strong>
                    <span>{item.title}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>작성자</strong>
                    <span>{item.author}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>담당자</strong>
                    <span>{item.managerName || "미지정"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>프로젝트 상태</strong>
                    <span>{item.status || "-"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>우선순위</strong>
                    <span>{item.priority || "-"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>진행률</strong>
                    <span>{item.progress ?? 0}%</span>
                </div>

                <div className="todo-detail-row">
                    <strong>시작일</strong>
                    <span>{item.startDate || "미지정"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>종료일</strong>
                    <span>{item.endDate || "미지정"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>작성일자</strong>
                    <span>{item.date}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>수정일자</strong>
                    <span>{item.updatedAt || "-"}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>조회수</strong>
                    <span>{item.views ?? 0}</span>
                </div>

                <div className="todo-detail-description">
                    <h3>프로젝트 내용</h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>{item.content}</p>
                </div>
            </div>

            <section
                className="todo-completion-panel"
                aria-labelledby="todo-completion-title"
            >
                <div>
                    <h3 id="todo-completion-title">프로젝트 완료 요청</h3>
                    <p role="status">{completionMessage}</p>
                    <p>
                        로그인 직원 ID: {String(loginUser.id ?? "없음")}
                        {" / "}
                        프로젝트 담당자 ID: {String(item.managerId ?? "없음")}
                        {" / "}
                        프로젝트 상태: [{item.status}]
                    </p>
                </div>

                <button
                    type="button"
                    className="todo-completion-button"
                    onClick={handleRequestCompletion}
                    disabled={completionSaving || !canRequestCompletion}
                >
                    {completionSaving
                        ? "요청 중..."
                        : item.status === "완료 요청"
                            ? "승인 대기 중"
                            : item.status === "완료"
                                ? "완료됨"
                                : "완료 요청"}
                </button>
            </section>

            {/* 다른 프로젝트 목록 */}
            <div className="detail-other todo-detail-other">
                <h3>다른 프로젝트</h3>
                <div className="todo-list-head detail-columns">
                    <div className="todo-head-title">
                        <span>번호</span>
                        <span>제목</span>
                    </div>
                    <span>작성자</span>
                </div>

                <ol className="todo-list">
                    {otherTodo.slice(start, end).map(other => (
                        <li key={other.id} className="todo-item detail-columns">
                            <div className="todo-title">
                                <span className="todo-number">{other.id}</span>
                                <Link
                                    to={`/todo/${other.id}`}
                                    onClick={() => {
                                        setPages(1);
                                        window.scrollTo(0, 0);
                                    }}
                                >
                                    {other.title}
                                </Link>
                            </div>
                            <span className="todo-author">{other.author}</span>
                        </li>
                    ))}
                </ol>

                {otherTodo.length === 0 && (
                    <p className="todo-empty">다른 프로젝트가 없습니다.</p>
                )}

                {totalPages > 1 && (
                    <div className="todo-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <button
                                key={num}
                                className={currentPage === num ? "active" : ""}
                                onClick={() => setPages(num)}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 하단 목록 버튼 */}
            <div className="todo-detail-bottom">
                <button
                    className="todo-detail-back"
                    onClick={() => navigate("/todo")}
                >
                    프로젝트 목록으로 돌아가기
                </button>
            </div>
        </main>
    );
}

export default Todo_detail;
