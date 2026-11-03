
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Todo({ todo, onAddTodo }) {

    const navigate = useNavigate();

    const location = useLocation();

    // 캘린더에서 선택한 날짜
    const selectedDate = location.state?.startDate || "";

    // 검색 및 페이지
    const [search, setSearch] = useState("");
    const [pages, setPages] = useState(1);

    // 새로운 프로젝트
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    // 프로젝트 상태와 우선순위
    const [status, setStatus] = useState("예정");
    const [priority, setPriority] = useState("보통");

    // 프로젝트 시작일과 종료일
    const [startDate, setStartDate] = useState(selectedDate);
    const [endDate, setEndDate] = useState(selectedDate);

    // 프로젝트 제목 검색
    const filteredTodo = [...todo]
        .filter(item =>
            item.title.toLowerCase().includes(search.trim().toLowerCase())
        )
        .sort((a, b) =>
            (Number(b.sortAt ?? 0) - Number(a.sortAt ?? 0)) ||
            (b.id - a.id)
        );

    // 페이지네이션 (10개씩)
    const totalPages = Math.ceil(filteredTodo.length / 10);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 10;
    const end = start + 10;


    /* 프로젝트 등록 */
    const handleAddTodo = async () => {

        // 이미 등록 중이면 추가 요청하지 않음
        if (isSaving) return;

        if (title.trim() === "") {
            alert("프로젝트 제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("프로젝트 내용을 입력해주세요.");
            return;
        }

        if (title.trim().length > 200) {
            alert("제목은 최대 200자까지 입력할 수 있습니다.");
            return;
        }

        if (!startDate || !endDate) {
            alert("프로젝트 시작일과 종료일을 선택해주세요.");
            return;
        }

        if (endDate < startDate) {
            alert("종료일은 시작일보다 빠를 수 없습니다.");
            return;
        }

        // 입력값 검사가 끝났으므로 등록 시작
        setIsSaving(true);

        try {
            const newId = await onAddTodo(
                title.trim(),
                content.trim(),
                startDate,
                endDate,
                status,
                priority
            );

            setTitle("");
            setContent("");
            setStartDate("");
            setEndDate("");
            setStatus("예정");
            setPriority("보통");

            alert("프로젝트가 등록되었습니다.");

            navigate(`/todo/${newId}`);

        } catch (error) {
            console.error("프로젝트 등록 오류:", error);
            alert(error.message || "프로젝트 등록 실패");

        } finally {
            // 성공하든 실패하든 등록 중 상태 해제
            setIsSaving(false);
        }
    };


    // 검색 리셋
    const handleReset = () => {
        setSearch("");
        setPages(1);
    };

    return (
        <main className="todo-page todo-manage-page">

            {/* 상단 제목 */}
            <div className="todo-header todo-manage-header">
                <div>
                    <h1>프로젝트</h1>
                    <p>
                        사내 프로젝트를 조회할 수 있습니다.
                    </p>
                </div>

                <button
                    className="todo-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 프로젝트 통계 */}
            <div className="todo-summary">
                <span>전체 프로젝트 {todo.length}개</span>
                <span>조회된 프로젝트 {filteredTodo.length}개</span>
            </div>

            {/* 프로젝트 검색 */}
            <section className="todo-filter">

                <label htmlFor="todo-search">
                    프로젝트 제목 검색
                </label>

                <input
                    id="todo-search"
                    type="text"
                    placeholder="프로젝트 제목 검색"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPages(1);
                    }}
                />

            </section>

            {/* 프로젝트 등록 */}
            <section className="todo-register">

                <h3>새로운 프로젝트 등록</h3>

                <div className="todo-register-form">

                    <input
                        type="text"
                        placeholder="프로젝트 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        placeholder="프로젝트 내용을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="5"
                    />

                    {/* 프로젝트 상태 */}
                    <div className="todo-select-field">
                        <label htmlFor="todo-status">프로젝트 상태</label>

                        <select
                            id="todo-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="예정">예정</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                            <option value="보류">보류</option>
                        </select>
                    </div>

                    {/* 프로젝트 우선순위 */}
                    <div className="todo-select-field">
                        <label htmlFor="todo-priority">우선순위</label>

                        <select
                            id="todo-priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="낮음">낮음</option>
                            <option value="보통">보통</option>
                            <option value="높음">높음</option>
                        </select>
                    </div>

                    {/* 프로젝트 일정 설정 */}
                    <div className="todo-date-fields">

                        <div>
                            <label htmlFor="todo-start-date">
                                프로젝트 시작일
                            </label>

                            <input
                                id="todo-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="todo-end-date">
                                프로젝트 종료일
                            </label>

                            <input
                                id="todo-end-date"
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={handleAddTodo}
                        disabled={isSaving}
                    >
                        {isSaving ? "등록 중…" : "+ 프로젝트 등록 요청"}
                    </button>

                </div>
            </section>

            {/* 프로젝트 목록 */}
            <section className="todo-list-section">

                <div className="todo-list-header">
                    <h3>프로젝트 목록</h3>
                    <span>{filteredTodo.length}건</span>
                </div>

                <table className="todo-table">


                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>프로젝트 ID</th>
                            <th>프로젝트 제목</th>
                            <th>작성자</th>
                            <th>작성일자</th>
                            <th>조회수</th>
                        </tr>
                    </thead>


                    <tbody>
                        {filteredTodo.length > 0 ? (


                            filteredTodo.slice(start, end).map((item, index) => (
                                <tr key={item.id}>

                                    {/* 프로젝트 목록 순서 */}
                                    <td>{start + index + 1}</td>

                                    {/* 실제 MySQL 프로젝트 ID */}
                                    <td>{item.id}</td>

                                    {/* 프로젝트 제목 */}
                                    <td>
                                        <button
                                            className="todo-title-link"
                                            onClick={() => navigate(`/todo/${item.id}`)}
                                        >
                                            {item.title}
                                        </button>
                                    </td>

                                    <td>{item.author}</td>
                                    <td>{item.date}</td>
                                    <td>{item.views ?? 0}</td>

                                </tr>
                            ))


                        ) : (

                            <tr>
                                <td colSpan="6" className="todo-empty">
                                    {todo.length === 0
                                        ? "등록된 프로젝트가 없습니다."
                                        : "검색 결과가 없습니다."}
                                </td>
                            </tr>

                        )}
                    </tbody>

                </table>

                {/* 페이지 번호 */}
                {totalPages > 1 && (
                    <div className="todo-pages">

                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map((num) => (
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

            </section>

            {/* 하단 설명 */}
            <p className="todo-footer">
                프로젝트 제목을 클릭하면 상세 내용을 확인할 수 있습니다.
            </p>

        </main>
    );
}

export default Todo;
