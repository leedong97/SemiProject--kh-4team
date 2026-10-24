
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

function Todo_detail({ todo, onViewTodo, onUpdateTodo }) {

    const { id } = useParams();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pages, setPages] = useState(1);

    // 프로젝트 수정 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    const viewedRequest = useRef({
        id: null,
        promise: null
    });


    /* MySQL 프로젝트 상세 조회 + 조회수 증가 */
    useEffect(() => {

        const controller = new AbortController();

        const loadTodoDetail = async () => {

            setLoading(true);
            setError("");
            setItem(null);
            setPages(1);
            setIsEditing(false);

            try {

                // 동일한 프로젝트 조회수 중복 증가 방지
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
                    throw new Error(
                        data.message || "프로젝트 상세 조회 실패"
                    );
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


    /* 수정 버튼 */
    const handleEdit = () => {

        setEditTitle(item.title);
        setEditContent(item.content);
        setIsEditing(true);

    };


    /* 수정 취소 */
    const handleCancel = () => {

        setEditTitle(item.title);
        setEditContent(item.content);
        setIsEditing(false);

    };


    /* 프로젝트 수정 저장 */
    const handleSave = async () => {

        if (isSaving) return;

        const title = editTitle.trim();
        const content = editContent.trim();

        if (title === "") {
            alert("프로젝트 제목을 입력해주세요.");
            return;
        }

        if (content === "") {
            alert("프로젝트 내용을 입력해주세요.");
            return;
        }

        if (title.length > 200) {
            alert("제목은 최대 200자까지 입력할 수 있습니다.");
            return;
        }

        setIsSaving(true);

        try {

            // MySQL 프로젝트 수정
            await onUpdateTodo(Number(id), title, content);

            // 수정 완료 후 상세정보 다시 조회
            let refreshFailed = false;

            try {

                const response = await fetch(
                    `http://localhost:5000/api/projects/${id}`
                );

                if (!response.ok) {
                    throw new Error("수정된 프로젝트 재조회 실패");
                }

                const data = await response.json();

                setItem(data);

            } catch (refreshError) {

                console.error("수정 후 조회 오류:", refreshError);

                // 수정 자체는 성공했으므로 제목과 내용은 반영
                setItem(prev => ({
                    ...prev,
                    title,
                    content
                }));

                refreshFailed = true;
            }

            setIsEditing(false);

            if (refreshFailed) {
                alert(
                    "프로젝트 수정은 완료됐지만 수정일을 다시 불러오지 못했습니다. 새로고침하여 확인해주세요."
                );
            } else {
                alert("프로젝트가 수정되었습니다!");
            }

        } catch (error) {

            console.error("프로젝트 수정 오류:", error);
            alert(error.message || "프로젝트 수정에 실패했습니다.");

        } finally {

            setIsSaving(false);

        }

    };


    /* 다른 프로젝트 목록 */
    const otherTodo = todo.filter(
        item => item.id !== Number(id)
    );


    /* 페이지네이션 */
    const totalPages = Math.ceil(otherTodo.length / 5);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 5;
    const end = start + 5;


    /* 로딩 중 */
    if (loading) {
        return (
            <main className="todo-page todo-detail-page">
                <h2>프로젝트를 불러오는 중입니다...</h2>
            </main>
        );
    }


    /* 조회 실패 */
    if (error || !item) {
        return (
            <main className="todo-page todo-detail-page">
                <h2>{error || "존재하지 않는 프로젝트입니다."}</h2>
                <button onClick={() => navigate("/todo")}>
                    목록으로 돌아가기
                </button>
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

                <button onClick={() => navigate("/todo")}>
                    목록으로
                </button>

            </div>


            {/* 프로젝트 상세정보 */}
            <div className="todo-detail-content">

                <div className="todo-detail-row">
                    <strong>프로젝트 제목</strong>

                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            maxLength={200}
                            onChange={(e) => setEditTitle(e.target.value)}
                            disabled={isSaving}
                            style={{ width: "100%" }}
                        />
                    ) : (
                        <span>{item.title}</span>
                    )}
                </div>

                <div className="todo-detail-row">
                    <strong>작성자</strong>
                    <span>{item.author}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>담당자</strong>
                    <span>{item.managerId ?? "미지정"}</span>
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


                {/* 프로젝트 내용 */}
                <div className="todo-detail-description">
                    <h3>프로젝트 내용</h3>

                    {isEditing ? (
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            disabled={isSaving}
                            rows={8}
                            style={{ width: "100%" }}
                        />
                    ) : (
                        <p style={{ whiteSpace: "pre-wrap" }}>
                            {item.content}
                        </p>
                    )}

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
                    {otherTodo.slice(start, end).map((other, index) => (
                        <li
                            key={other.id}
                            className="todo-item detail-columns"
                        >
                            <div className="todo-title">
                                <span className="todo-number">
                                    {start + index + 1}
                                </span>

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

                            <span className="todo-author">
                                {other.author}
                            </span>
                        </li>
                    ))}
                </ol>

                {otherTodo.length === 0 && (
                    <p className="todo-empty">
                        다른 프로젝트가 없습니다.
                    </p>
                )}

                {totalPages > 1 && (
                    <div className="todo-pages">

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map(num => (
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


            {/* 하단 버튼 */}
            <div className="todo-detail-bottom">

                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? "저장 중..." : "저장"}
                        </button>

                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            취소
                        </button>
                    </>
                ) : (
                    <button onClick={handleEdit}>
                        수정
                    </button>
                )}

                <button
                    className="todo-detail-back"
                    onClick={() => navigate("/todo")}
                    disabled={isSaving}
                >
                    프로젝트 목록으로 돌아가기
                </button>

            </div>

        </main>
    );
}

export default Todo_detail;
