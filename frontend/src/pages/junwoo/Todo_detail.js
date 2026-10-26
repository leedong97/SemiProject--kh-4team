
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

    // 수정 시 날짜 선택
    const [editStartDate, setEditStartDate] = useState("");
    const [editEndDate, setEditEndDate] = useState("");

    // 상태, 우선순위, 진행률
    const [editStatus, setEditStatus] = useState("예정");
    const [editPriority, setEditPriority] = useState("보통");
    const [editProgress, setEditProgress] = useState("0");

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

        // MySQL에 저장된 기존 값 불러오기
        setEditStatus(item.status ?? "예정");
        setEditPriority(item.priority ?? "보통");
        setEditProgress(String(item.progress ?? 0));

        setEditStartDate((item.startDate || "").replace(/\./g, "-"));
        setEditEndDate((item.endDate || "").replace(/\./g, "-"));

        setIsEditing(true);

    };


    /* 수정 취소 */
    const handleCancel = () => {

        setEditTitle(item.title);
        setEditContent(item.content);

        setEditStatus(item.status ?? "예정");
        setEditPriority(item.priority ?? "보통");
        setEditProgress(String(item.progress ?? 0));

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

        // 진행률 검사
        const progress = Number(editProgress);

        if (
            editProgress.trim() === "" ||
            !Number.isInteger(progress) ||
            progress < 0 ||
            progress > 100
        ) {
            alert("진행률은 0~100 사이의 정수로 입력해주세요.");
            return;
        }

        if (Boolean(editStartDate) !== Boolean(editEndDate)) {
            alert("시작일과 종료일을 모두 입력해주세요.");
            return;
        }

        if (editStartDate && editEndDate < editStartDate) {
            alert("종료일은 시작일보다 빠를 수 없습니다.");
            return;
        }

        setIsSaving(true);

        try {

            // MySQL 프로젝트 수정
            await onUpdateTodo(
                Number(id),
                title,
                content,
                editStatus,
                editPriority,
                progress,
                editStartDate || null,
                editEndDate || null
            );

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

                // 수정은 성공했으므로 화면에는 변경 내용 반영
                setItem(prev => ({
                    ...prev,
                    title,
                    content,
                    status: editStatus,
                    priority: editPriority,
                    progress
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

    const currentPage = Math.min(
        pages,
        Math.max(totalPages, 1)
    );

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

                <h2>
                    {error || "존재하지 않는 프로젝트입니다."}
                </h2>

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
                    <p>
                        등록된 프로젝트의 내용을 확인할 수 있습니다.
                    </p>
                </div>

                <button onClick={() => navigate("/todo")}>
                    목록으로
                </button>

            </div>


            {/* 프로젝트 상세정보 */}
            <div className="todo-detail-content">

                {/* 프로젝트 제목 */}
                <div className="todo-detail-row">

                    <strong>프로젝트 제목</strong>

                    {isEditing ? (

                        <input
                            type="text"
                            value={editTitle}
                            maxLength={200}
                            onChange={(e) =>
                                setEditTitle(e.target.value)
                            }
                            disabled={isSaving}
                            style={{ width: "100%" }}
                        />

                    ) : (

                        <span>{item.title}</span>

                    )}

                </div>


                {/* 작성자 */}
                <div className="todo-detail-row">

                    <strong>작성자</strong>

                    <span>{item.author}</span>

                </div>


                {/* 담당자 */}
                <div className="todo-detail-row">

                    <strong>담당자</strong>

                    <span>{item.managerId ?? "미지정"}</span>

                </div>


                {/* 프로젝트 상태 */}
                <div className="todo-detail-row">

                    <strong>프로젝트 상태</strong>

                    {isEditing ? (

                        <select
                            value={editStatus}
                            onChange={(e) =>
                                setEditStatus(e.target.value)
                            }
                            disabled={isSaving}
                        >
                            <option value="예정">예정</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                            <option value="보류">보류</option>
                        </select>

                    ) : (

                        <span>{item.status || "-"}</span>

                    )}

                </div>


                {/* 우선순위 */}
                <div className="todo-detail-row">

                    <strong>우선순위</strong>

                    {isEditing ? (

                        <select
                            value={editPriority}
                            onChange={(e) =>
                                setEditPriority(e.target.value)
                            }
                            disabled={isSaving}
                        >
                            <option value="낮음">낮음</option>
                            <option value="보통">보통</option>
                            <option value="높음">높음</option>
                        </select>

                    ) : (

                        <span>{item.priority || "-"}</span>

                    )}

                </div>


                {/* 진행률 */}
                <div className="todo-detail-row">

                    <strong>진행률</strong>

                    {isEditing ? (

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={editProgress}
                            onChange={(e) =>
                                setEditProgress(e.target.value)
                            }
                            disabled={isSaving}
                        />

                    ) : (

                        <span>{item.progress ?? 0}%</span>

                    )}

                </div>



                <div className="todo-detail-row">
                    <strong>시작일</strong>

                    {isEditing ? (
                        <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            disabled={isSaving}
                        />
                    ) : (
                        <span>{item.startDate || "미지정"}</span>
                    )}
                </div>

                <div className="todo-detail-row">
                    <strong>종료일</strong>

                    {isEditing ? (
                        <input
                            type="date"
                            value={editEndDate}
                            min={editStartDate || undefined}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            disabled={isSaving}
                        />
                    ) : (
                        <span>{item.endDate || "미지정"}</span>
                    )}
                </div>



                {/* 작성일자 */}
                <div className="todo-detail-row">

                    <strong>작성일자</strong>

                    <span>{item.date}</span>

                </div>


                {/* 수정일자 */}
                <div className="todo-detail-row">

                    <strong>수정일자</strong>

                    <span>{item.updatedAt || "-"}</span>

                </div>


                {/* 조회수 */}
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
                            onChange={(e) =>
                                setEditContent(e.target.value)
                            }
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


            {/* 프로젝트 수정 버튼 */}
            <div className="todo-detail-edit">

                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? "저장 중..." : "수정 완료"}
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

                    {otherTodo.slice(start, end).map(
                        (other, index) => (

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

                        )
                    )}

                </ol>


                {otherTodo.length === 0 && (

                    <p className="todo-empty">
                        다른 프로젝트가 없습니다.
                    </p>

                )}


                {/* 페이지 번호 */}
                {totalPages > 1 && (

                    <div className="todo-pages">

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map(num => (

                            <button
                                key={num}
                                className={
                                    currentPage === num ? "active" : ""
                                }
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
