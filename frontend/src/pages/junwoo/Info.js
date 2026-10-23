
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJunwoo } from "./JunwooContext";

function Info({ info, delInfo, onAddInfo }) {

    const navigate = useNavigate();
    const { pinInfo } = useJunwoo();

    // 검색 및 페이지
    const [search, setSearch] = useState("");
    const [pages, setPages] = useState(1);

    // 새로운 공지사항
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");


    /* 공지사항 제목 검색 + 상단 고정 정렬 */
    const filteredInfo = [...info]
        .filter(item =>
            item.title.toLowerCase().includes(search.trim().toLowerCase())
        )
        .sort((a, b) => {

            // 고정된 공지사항 먼저 표시
            const pinnedA = Number(Boolean(a.isPinned));
            const pinnedB = Number(Boolean(b.isPinned));

            if (pinnedA !== pinnedB) {
                return pinnedB - pinnedA;
            }

            // 같은 고정 상태라면 최신 글 먼저
            return b.id - a.id;

        });


    // 페이지네이션 (10개씩)
    const totalPages = Math.ceil(filteredInfo.length / 10);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 10;
    const end = start + 10;


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

            const newId = await onAddInfo(
                title.trim(),
                content.trim()
            );

            setTitle("");
            setContent("");

            // 등록한 공지사항 상세 페이지로 이동
            navigate(`/info/${newId}`);

        } catch (error) {

            console.error("공지사항 등록 오류:", error);
            alert("공지사항 등록에 실패했습니다.");

        }
    };

    // 검색 리셋
    const handleReset = () => {
        setSearch("");
        setPages(1);
    };


    /* 공지사항 삭제 */
    const handleDeleteInfo = async (id) => {

        if (!window.confirm('정말 삭제하시겠습니까?')) {
            return;
        }

        try {

            await delInfo(id);

            alert('공지사항이 삭제되었습니다.');

        } catch (error) {

            console.error('공지사항 삭제 오류:', error);
            alert('공지사항 삭제에 실패했습니다.');

        }

    };


    /* 공지사항 상단 고정 / 해제 */
    const handlePinInfo = async (id, isPinned) => {

        try {

            await pinInfo(id, isPinned);

            alert(
                isPinned
                    ? "공지사항이 상단에 고정되었습니다."
                    : "공지사항 고정이 해제되었습니다."
            );

        } catch (error) {

            console.error("공지사항 고정 오류:", error);
            alert("공지사항 고정 설정에 실패했습니다.");

        }

    };


    return (

        <main className="info-page info-manage-page">

            {/* 상단 제목 */}
            <div className="info-header info-manage-header">
                <div>
                    <h1>공지사항 관리</h1>
                    <p>
                        사내 공지사항을 조회하고 관리할 수 있습니다.
                    </p>
                </div>

                <button
                    className="info-reset"
                    onClick={handleReset}
                >
                    검색 리셋
                </button>
            </div>

            {/* 공지사항 통계 */}
            <div className="info-summary">
                <span>전체 공지사항 {info.length}건</span>
                <span>조회된 공지사항 {filteredInfo.length}건</span>
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

            {/* 공지사항 등록 */}
            <section className="info-register">

                <h3>새로운 공지사항 등록</h3>

                <div className="info-register-form">

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
            <section className="info-list-section">

                <div className="info-list-header">
                    <h3>공지사항 목록</h3>
                    <span>{filteredInfo.length}건</span>
                </div>

                <table className="info-table">

                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>공지사항 제목</th>
                            <th>작성자</th>
                            <th>작성일자</th>
                            <th>조회수</th>
                            <th>관리</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredInfo.length > 0 ? (

                            filteredInfo.slice(start, end).map((item, index) => (
                                <tr key={item.id}>

                                    <td>{start + index + 1}</td>

                                    <td>
                                        <button
                                            className="info-title-link"
                                            onClick={() =>
                                                navigate(`/info/${item.id}`)
                                            }
                                        >
                                            {Boolean(item.isPinned) && "📌 "}
                                            {item.title}
                                        </button>
                                    </td>

                                    <td>{item.author}</td>

                                    <td>{item.date}</td>

                                    <td>{item.views ?? 0}</td>


                                    <td>
                                        {/* 상단 고정 버튼 */}
                                        <button
                                            onClick={() =>
                                                handlePinInfo(
                                                    item.id,
                                                    !Boolean(item.isPinned)
                                                )
                                            }
                                        >
                                            {item.isPinned ? "고정 해제" : "📌 상단 고정"}
                                        </button>

                                        {/* 삭제 버튼 */}
                                        <button
                                            className="info-delete"
                                            onClick={() => handleDeleteInfo(item.id)}
                                        >
                                            삭제
                                        </button>
                                    </td>


                                </tr>
                            ))

                        ) : (

                            <tr>
                                <td colSpan="6" className="info-empty">
                                    {info.length === 0
                                        ? "등록된 공지사항이 없습니다."
                                        : "검색 결과가 없습니다."}
                                </td>
                            </tr>

                        )}
                    </tbody>

                </table>

                {/* 페이지 번호 */}
                {totalPages > 1 && (
                    <div className="info-pages">

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
            <p className="info-footer">
                공지사항 제목을 클릭하면 상세 내용을 확인할 수 있습니다.
            </p>

        </main>
    );
}

export default Info;
