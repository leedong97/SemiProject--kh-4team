
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Info({ info, delInfo }) {

    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [keyword, setKeyword] = useState('');

    const searchInfo = [...info].filter((item) =>
        item.title.toLowerCase().includes(keyword.toLowerCase())
    );

    const searchBtn = () => {
        setKeyword(search.trim());
        setPages(1);
    }

    const totalPages = Math.ceil(searchInfo.length / 10);

    const currentPage = Math.min(pages, Math.max(totalPages, 1));

    const start = (currentPage - 1) * 10;
    const end = start + 10;

    return (

        <div className="info-page">

            <div className="info-header">
                <h2>공지사항</h2>
                <p>사내 소식과 공지사항을 확인하세요.</p>
            </div>

            <div className="info-search">

                <input type="text"
                    placeholder="제목 입력"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);

                        if( e.target.value.trim() === '' ){
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

            <div className="info-list-head">

                <div className="info-head-title">
                    <span>번호</span>
                    <span>제목</span>
                </div>

                <span>작성자</span>
                <span></span>

            </div>

            <ol className="info-list">
                {
                    searchInfo.slice(start, end).map((item, index) => (
                        <li key={item.id} className="info-item">

                            <div className="info-title">
                                <span className="info-number">
                                    {start + index + 1}
                                </span>

                                <Link to={`/info/${item.id}`}>
                                    {item.title}
                                </Link>
                            </div>

                            <span className="info-author">
                                {item.author}
                            </span>



                        </li>
                    ))
                }
            </ol>

            {searchInfo.length === 0 &&
                <p className="info-empty">
                    {info.length === 0
                        ? '등록된 공지사항이 없습니다.'
                        : '검색 결과가 없습니다.'}
                </p>
            }

            <div className="info-pages">
                {
                    Array.from({ length: totalPages }, (_, i) => i + 1)
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



        </div>

    );
}

export default Info;
