
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Todo_set({ todo, onAddTodo }) {

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    // 프로젝트 일정
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // 프로젝트 제목 검색
    const filteredTodo = todo.filter((item) =>
        item.title.toLowerCase().includes(search.trim().toLowerCase())
    );


    /* 프로젝트 등록 */
    const handleAddTodo = async () => {

        if (title.trim() === "") {
            alert("프로젝트 제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("프로젝트 내용을 입력해주세요.");
            return;
        }

        if (title.trim().length > 200) {
            alert("프로젝트 제목은 최대 200자까지 입력할 수 있습니다.");
            return;
        }

        // 시작일 검사
        if (startDate === "") {
            alert("프로젝트 시작일을 선택해주세요.");
            return;
        }

        // 종료일 검사
        if (endDate === "") {
            alert("프로젝트 종료일을 선택해주세요.");
            return;
        }

        // 날짜 순서 검사
        if (endDate < startDate) {
            alert("종료일은 시작일보다 빠를 수 없습니다.");
            return;
        }

        if (isSaving) return;

        setIsSaving(true);

        try {
            await onAddTodo(
                title.trim(),
                content.trim(),
                startDate,
                endDate
            );

            alert("프로젝트가 등록되었습니다.");

            setTitle("");
            setContent("");
            setStartDate("");
            setEndDate("");

        } catch (error) {
            console.error("프로젝트 등록 오류:", error);
            alert(error.message || "프로젝트 등록에 실패했습니다.");

        } finally {
            setIsSaving(false);
        }

    };


    // 검색 초기화
    const handleReset = () => {
        setSearch("");
    };

    return (
        <main className="todo-set-page">

            {/* 상단 제목 */}
            <div className="todo-set-header">
                <div>
                    <h1>프로젝트 등록 및 관리</h1>
                    <p>프로젝트를 등록하고 관리할 수 있습니다.</p>
                </div>

                <button
                    className="todo-set-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 프로젝트 건수 */}
            <div className="todo-set-summary">
                <span>전체 프로젝트 {todo.length}개</span>
                <span>조회된 프로젝트 {filteredTodo.length}개</span>
            </div>

            {/* 프로젝트 검색 */}
            <section className="todo-set-filter">
                <label htmlFor="todo-search">
                    프로젝트 제목 검색
                </label>

                <input
                    id="todo-search"
                    type="text"
                    placeholder="프로젝트 제목 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </section>

            {/* 프로젝트 등록 */}
            <section className="todo-set-register">

                <h3>새로운 프로젝트 등록</h3>

                <div className="todo-set-register-form">

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


                    {/* 프로젝트 일정 설정 */}
                    <div className="todo-set-date-fields">

                        <div>
                            <label htmlFor="project-start-date">
                                프로젝트 시작일
                            </label>

                            <input
                                id="project-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>

                        <div>
                            <label htmlFor="project-end-date">
                                프로젝트 종료일
                            </label>

                            <input
                                id="project-end-date"
                                type="date"
                                value={endDate}
                                min={startDate || undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>

                    </div>

                    {/* 중복 등록이 안되게 삼항연산자로 막아놓기 */}
                    <button onClick={handleAddTodo} disabled={isSaving}>
                        {isSaving ? "등록 중..." : "+ 프로젝트 등록"}
                    </button>

                </div>
            </section>

            {/* 프로젝트 목록 */}
            <section className="todo-set-list-section">

                <div className="todo-set-list-header">
                    <h3>프로젝트 목록</h3>
                    <span>{filteredTodo.length}건</span>
                </div>

                <table className="todo-set-table">
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>프로젝트 제목</th>
                            <th>작성자</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTodo.length > 0 ? (
                            filteredTodo.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <Link to={`/todo/${item.id}`}>
                                            {item.title}
                                        </Link>
                                    </td>

                                    <td>{item.author}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="todo-set-empty">
                                    조회된 프로젝트가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </section>

            {/* 하단 */}
            <div className="todo-set-footer">
                <Link to="/todo">
                    프로젝트 목록으로 돌아가기
                </Link>
            </div>

        </main>
    );
}

export default Todo_set;
