import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

function Info_detail({ info, onViewInfo }) {

    const { id } = useParams();

    const [pages, setPages] = useState(1);

    const viewedId = useRef(null);

    useEffect(() => {

        if (viewedId.current === id) return;

        viewedId.current = id;
        onViewInfo(Number(id));

    }, [id, onViewInfo]);

    // 현재 보고 있는 공지사항
    const item = info.find(item => item.id === Number(id));

    // 현재 공지사항을 제외한 다른 공지사항
    const otherInfo = [...info].reverse().filter(item =>
        item.id !== Number(id)
    );

    // 5개씩 페이지네이션
    const totalPages = Math.ceil(otherInfo.length / 5);

    const currentPage = Math.min(pages, Math.max(totalPages, 1));

    const start = (currentPage - 1) * 5;
    const end = start + 5;

    if (!item) {
        return <h2>존재하지 않는 공지사항입니다.</h2>;
    }

    return (
        <div className="info-page info-detail">

            <div className="info-header">
                <h2>{item.title}</h2>

                <p>작성자 : {item.author}</p>
                <p>작성일자 : {item.date}</p>
                <p>조회수 : {item.views ?? 0}</p>
            </div>

            <div className="info-detail-content">
                <p>{item.content}</p>
            </div>

            <hr />

            {/* 다른 공지사항 목록 */}
            <div className="detail-other">

                <h3>다른 공지사항</h3>

                <div className="info-list-head detail-columns">
                    <div className="info-head-title">
                        <span>번호</span>
                        <span>제목</span>
                    </div>
                    <span>작성자</span>
                </div>

                <ol className="info-list">
                    {
                        otherInfo.slice(start, end).map((other, index) => (
                            <li
                                key={other.id}
                                className="info-item detail-columns"
                            >
                                <div className="info-title">

                                    <span className="info-number">
                                        {start + index + 1}
                                    </span>

                                    <Link
                                        to={`/info/${other.id}`}
                                        onClick={() => {
                                            setPages(1);
                                            window.scrollTo(0, 0);
                                        }}
                                    >
                                        {other.title}
                                    </Link>

                                </div>

                                <span className="info-author">
                                    {other.author}
                                </span>
                            </li>
                        ))
                    }
                </ol>

                {otherInfo.length === 0 &&
                    <p className="info-empty">
                        다른 공지사항이 없습니다.
                    </p>
                }

                {/* 페이지 번호 */}
                {totalPages > 1 &&
                    <div className="info-pages">
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

            <Link to="/info" className="info-detail-back">
                목록으로
            </Link>

        </div>
    );
}

export default Info_detail;