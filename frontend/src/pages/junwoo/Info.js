
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Info({ info = [] }) {

    const navigate = useNavigate();

    // 검색 및 페이지
    const [search, setSearch] = useState("");
    const [pages, setPages] = useState(1);

    // 제목 검색 후 상단 고정 공지 우선, 같은 그룹에서는 최신순
    const filteredInfo = [...info]
        .filter(item =>
            String(item.title ?? "")
                .toLowerCase()
                .includes(search.trim().toLowerCase())
        )
        .sort((a, b) => {
            const aPinned = Number(a.isPinned) === 1;
            const bPinned = Number(b.isPinned) === 1;

            // 고정 공지를 일반 공지보다 먼저 표시
            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1;
            }

            // 고정 여부가 같으면 최신 공지부터 표시
            return Number(b.id) - Number(a.id);
        });

    // 검색 결과에 포함된 중요 공지 개수
    const pinnedCount = filteredInfo.filter(
        item => Number(item.isPinned) === 1
    ).length;

    // 페이지네이션 (10개씩)
    const totalPages = Math.ceil(filteredInfo.length / 10);

    const currentPage = Math.min(pages, Math.max(totalPages, 1));

    const start = (currentPage - 1) * 10;
    const end = start + 10;

    const handleReset = () => {
        setSearch("");
        setPages(1);
    };

    return (

        <main className="info-page info-manage-page">

            {/* 상단 제목과 검색 리셋 */}
            <div className="info-header info-manage-header">
                <div>
                    <h1>공지사항</h1>
                    <p>사내 공지사항을 조회할 수 있습니다.</p>
                </div>

                <button
                    type="button"
                    className="info-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 전체 건수와 검색 결과 건수 */}
            <div className="info-summary">
                <span>전체 공지사항 {info.length}개</span>
                <span>조회된 공지사항 {filteredInfo.length}개</span>
            </div>

            {/* 공지사항 검색 */}
            <section className="info-filter">

                <label htmlFor="info-search">
                    공지사항 제목 검색
                </label>

                <input
                    id="info-search"
                    type="text"
                    placeholder="공지사항 제목 검색"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPages(1);
                    }}
                />

            </section>

            {/* 공지사항 목록 */}
            <section className="info-list-section">

                <div className="info-list-header">
                    <h3>공지사항 목록</h3>
                    <span>총 {filteredInfo.length}건</span>
                </div>

                <table className="info-table">

                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>공지사항 제목</th>
                            <th>작성자</th>
                            <th>작성일자</th>
                            <th>조회수</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredInfo.length > 0 ? (

                            filteredInfo.slice(start, end).map((item, index) => (

                                <tr key={item.id}>

                                    <td>
                                        {Number(item.isPinned) === 1 ? (
                                            <strong
                                                style={{
                                                    color: "#d32f2f",
                                                    whiteSpace: "nowrap"
                                                }}
                                            >
                                                [중요]
                                            </strong>
                                        ) : (
                                            start + index + 1 - pinnedCount
                                        )}
                                    </td>

                                    <td>
                                        <button
                                            className="info-title-link"
                                            onClick={() =>
                                                navigate(`/info/${item.id}`)
                                            }
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
                                <td colSpan="5" className="info-empty">
                                    {info.length === 0
                                        ? "등록된 공지사항이 없습니다."
                                        : "검색 결과가 없습니다."}
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (

                    <div className="info-pages">

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

            </section>

        </main>

    );

}

export default Info;
