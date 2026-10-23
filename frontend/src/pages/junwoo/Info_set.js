
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Info_set({ info, onAddInfo }) {

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [search, setSearch] = useState("");

    // 공지사항 제목 검색
    const filteredInfo = [...info].reverse().filter((item) =>
        item.title.toLowerCase().includes(search.trim().toLowerCase())
    );

    // 공지사항 등록
    const handleAddInfo = async () => {

        if (title.trim() === "") {
            alert("공지사항 제목을 입력해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("공지사항 내용을 입력해주세요.");
            return;
        }

        try {

            await onAddInfo(title.trim(), content.trim());

            alert('공지사항 등록 완료.');

            setTitle("");
            setContent("");

        } catch (error) {

            console.error('공지사항 등록 오류:', error);
            alert('공지사항 등록에 실패했습니다.');

        }
    };

    // 검색 초기화
    const handleReset = () => {
        setSearch("");
    };

    return (
        <main className="info-set-page">

            {/* 상단 제목 */}
            <div className="info-set-header">
                <div>
                    <h1>공지사항 등록 및 관리</h1>
                    <p>공지사항을 등록하고 관리할 수 있습니다.</p>
                </div>

                <button
                    className="info-set-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 공지사항 건수 */}
            <div className="info-set-summary">
                <span>전체 공지사항 {info.length}건</span>
                <span>조회된 공지사항 {filteredInfo.length}건</span>
            </div>

            {/* 제목 검색 */}
            <section className="info-set-filter">
                <label htmlFor="info-search">
                    공지사항 제목 검색
                </label>

                <input
                    id="info-search"
                    type="text"
                    placeholder="공지사항 제목 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </section>

            {/* 공지사항 등록 */}
            <section className="info-set-register">

                <h3>새로운 공지사항 등록</h3>

                <div className="info-set-register-form">

                    <input
                        type="text"
                        placeholder="공지사항 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <textarea
                        placeholder="공지사항 내용을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="5"
                    />

                    <button onClick={handleAddInfo}>
                        + 공지사항 등록
                    </button>

                </div>
            </section>

            {/* 공지사항 목록 */}
            <section className="info-set-list-section">

                <div className="info-set-list-header">
                    <h3>공지사항 목록</h3>
                    <span>{filteredInfo.length}건</span>
                </div>

                <table className="info-set-table">
                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>공지사항 제목</th>
                            <th>작성자</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredInfo.length > 0 ? (
                            filteredInfo.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <Link to={`/info/${item.id}`}>
                                            {item.title}
                                        </Link>
                                    </td>

                                    <td>{item.author}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="info-set-empty">
                                    조회된 공지사항이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </section>

            {/* 하단 */}
            <div className="info-set-footer">
                <Link to="/info">
                    공지사항 목록으로 돌아가기
                </Link>
            </div>

        </main>
    );
}

export default Info_set;
