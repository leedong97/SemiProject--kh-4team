import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

function Todo_detail({ todo, onViewTodo }) {

    const { id } = useParams();

    const [pages, setPages] = useState(1);

    const viewedId = useRef(null);

    useEffect(() => {

        if (viewedId.current === id) return;

        viewedId.current = id;
        onViewTodo(Number(id));

    }, [id, onViewTodo]);

    // 현재 보고 있는 프로젝트
    const item = todo.find(item => item.id === Number(id));

    // 현재 프로젝트를 제외한 다른 프로젝트
    const otherTodo = [...todo].reverse().filter(item =>
        item.id !== Number(id)
    );

    // 5개씩 페이지네이션
    const totalPages = Math.ceil(otherTodo.length / 5);

    const currentPage = Math.min(pages, Math.max(totalPages, 1));

    const start = (currentPage - 1) * 5;
    const end = start + 5;

    if (!item) {
        return <h2>존재하지 않는 프로젝트입니다.</h2>;
    }

    return (
        <div className="todo-page todo-detail">

            <div className="todo-header">
                <h2>{item.title}</h2>

                <p>작성자 : {item.author}</p>
                <p>작성일자 : {item.date}</p>
                <p>조회수 : {item.views ?? 0}</p>
            </div>

            <div className="todo-detail-content">
                <p>{item.content}</p>
            </div>

            <hr />

            {/* 다른 프로젝트 목록 */}
            <div className="detail-other">

                <h3>다른 프로젝트</h3>

                <div className="todo-list-head detail-columns">
                    <div className="todo-head-title">
                        <span>번호</span>
                        <span>제목</span>
                    </div>
                    <span>작성자</span>
                </div>

                <ol className="todo-list">
                    {
                        otherTodo.slice(start, end).map((other, index) => (
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
                        ))
                    }
                </ol>

                {otherTodo.length === 0 &&
                    <p className="todo-empty">
                        다른 프로젝트가 없습니다.
                    </p>
                }

                {/* 페이지 번호 */}
                {totalPages > 1 &&
                    <div className="todo-pages">
                        {
                            Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map(num => (
                                <button
                                    key={num}
                                    className={currentPage === num ? 'active' : ''}
                                    onClick={() => setPages(num)}
                                >
                                    {num}
                                </button>
                            ))
                        }
                    </div>
                }

            </div>

            <Link to="/todo" className="todo-detail-back">
                목록으로
            </Link>

        </div>
    );
}

export default Todo_detail;