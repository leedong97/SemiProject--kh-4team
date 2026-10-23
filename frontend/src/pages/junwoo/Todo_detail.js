
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

function Todo_detail({ todo, onViewTodo }) {

    const { id } = useParams();
    const navigate = useNavigate();

    const [pages, setPages] = useState(1);
    const viewedId = useRef(null);

    useEffect(() => {

        if (viewedId.current === id) return;

        viewedId.current = id;
        onViewTodo(Number(id));

    }, [id, onViewTodo]);

    // 현재 프로젝트
    const item = todo.find(
        item => item.id === Number(id)
    );

    // 다른 프로젝트 목록
    const otherTodo = [...todo].reverse().filter(
        item => item.id !== Number(id)
    );

    // 페이지네이션
    const totalPages = Math.ceil(otherTodo.length / 5);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 5;
    const end = start + 5;

    if (!item) {
        return (
            <main className="todo-page todo-detail-page">
                <h2>존재하지 않는 프로젝트입니다.</h2>
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
                    <span>{item.title}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>작성자</strong>
                    <span>{item.author}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>작성일자</strong>
                    <span>{item.date}</span>
                </div>

                <div className="todo-detail-row">
                    <strong>조회수</strong>
                    <span>{item.views ?? 0}</span>
                </div>

                {/* 프로젝트 내용 */}
                <div className="todo-detail-description">
                    <h3>프로젝트 내용</h3>
                    <p>{item.content}</p>
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

                {otherTodo.length === 0 &&
                    <p className="todo-empty">
                        다른 프로젝트가 없습니다.
                    </p>
                }

                {totalPages > 1 &&
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
                }

            </div>

            {/* 하단 버튼 */}
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
