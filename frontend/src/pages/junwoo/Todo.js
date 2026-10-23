import React, { useState } from "react";
import { Link } from "react-router-dom";

function Todo({ todo, delTodo }) {

    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [keyword, setKeyword] = useState('');

    const searchTodo = [...todo].reverse().filter((item) =>
        item.title.toLowerCase().includes(keyword.toLowerCase())
    );

    const searchBtn = () => {
        setKeyword(search.trim());
        setPages(1);
    }

    const totalPages = Math.ceil(searchTodo.length / 10);

    const currentPage = Math.min(pages, Math.max(totalPages, 1));

    const start = (currentPage - 1) * 10;
    const end = start + 10;

    return (

        <div className="todo-page">

            <div className="todo-header">

                <h2>프로젝트</h2>
                <p>프로젝트 관리 및 현황</p>

            </div>

            <div className="todo-search">

                <input type="text"
                    placeholder="제목 입력"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);

                        if (e.target.value.trim() === '') {
                            setKeyword('');
                            setPages(1);
                        }

                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') searchBtn();
                    }} />

                <button onClick={searchBtn}>
                    검색
                </button>

            </div>

            <div className="todo-list-head">

                <div className="todo-head-title">
                    <span>번호</span>
                    <span>제목</span>
                </div>

                <span>작성자</span>
                <span></span>

            </div>

            <ol className="todo-list">
                {
                    searchTodo.slice(start, end).map((item, index) => (
                        <li key={item.id} className="todo-item">

                            <div className="todo-title">

                                <span className="todo-number">
                                    {start + index + 1}
                                </span>

                                <Link to={`/todo/${item.id}`}>
                                    {item.title}
                                </Link>
                            </div>

                            <span className="todo-author">
                                {item.author}
                            </span>

                            <button className="todo-delete"
                                onClick={() => delTodo(item.id)}>
                                삭제
                            </button>

                        </li>
                    ))
                }
            </ol>

            {searchTodo.length === 0 &&
                <p className="todo-empty">
                    {todo.length === 0
                        ? '등록된 프로젝트가 없습니다.'
                        : '검색 결과가 없습니다.'
                    }
                </p>
            }

            <div className="todo-pages">
                {
                    Array.from({length: totalPages}, (_, i) => i + 1)
                    .map((num) => (
                        <button 
                            key={num}
                            className={currentPage === num ? 'active' : ''}
                            onClick={() => setPages(num)}>
                            {num}
                        </button>
                    ))
                }
            </div>

            <div className="todo-button">
                <Link to="/Todo/set" className="todo-add">
                    + 프로젝트 등록
                </Link>
            </div>

        </div>

    );
}


export default Todo;