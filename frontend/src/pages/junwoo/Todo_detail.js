import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

function Todo_detail({ todo, onViewTodo }) {
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
                    `http://localhost:5000/api/projects/${id}`,
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
                    <span>
                        {members.length > 1
                            ? `${members[0]} 외 ${members.length - 1}명`
                            : members[0] ?? item.managerName ?? "미지정"}
                    </span>
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
