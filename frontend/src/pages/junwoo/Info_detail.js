
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useJunwoo } from "./JunwooContext";

function Info_detail({ info, onViewInfo }) {

    const { id } = useParams();
    const navigate = useNavigate();
    const { updateInfo } = useJunwoo();

    const [pages, setPages] = useState(1);
    const viewedId = useRef(null);
    const viewPromiseRef = useRef(null);

    /* MySQL에서 가져올 공지사항 상세 데이터 */
    const [item, setItem] = useState(null);

    /* 데이터 로딩 상태 */
    const [loading, setLoading] = useState(true);

    /* 데이터 조회 오류 상태 */
    const [loadError, setLoadError] = useState(false);

    /* 공지사항 수정 상태 */
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // 현재 공지사항

    /* MySQL에서 공지사항 상세 조회 */
    useEffect(() => {

        let active = true;

        const loadDetail = async () => {

            setLoading(true);
            setLoadError(false);
            setItem(null);
            setIsEditing(false);

            try {

                const response = await fetch(
                    `http://localhost:5000/api/notices/${id}`
                );

                if (response.status === 404) {
                    return;
                }

                if (!response.ok) {
                    throw new Error('공지사항 상세 조회 실패');
                }


                const data = await response.json();

                if (!active) return;

                // 같은 공지사항에 중복 요청하지 않기
                if (viewedId.current !== id) {

                    viewedId.current = id;

                    viewPromiseRef.current = onViewInfo(Number(id));

                }

                let updatedViews = data.views ?? 0;

                try {

                    updatedViews = await viewPromiseRef.current;

                } catch (error) {

                    console.error('조회수 증가 오류:', error);

                }

                if (active) {
                    setItem({
                        ...data,
                        views: updatedViews
                    });
                }


            } catch (error) {

                console.error('공지사항 상세 조회 오류:', error);

                if (active) {
                    setLoadError(true);
                }

            } finally {

                if (active) {
                    setLoading(false);
                }

            }

        };

        loadDetail();

        return () => {
            active = false;
        };

    }, [id, onViewInfo]);


    /* 수정 시작 */
    const handleEdit = () => {
        setEditTitle(item.title);
        setEditContent(item.content);
        setIsEditing(true);
    };

    /* 수정 취소 */
    const handleCancel = () => {
        setIsEditing(false);
    };

    /* 공지사항 수정 저장 */
    const handleUpdate = async () => {

        if (editTitle.trim() === "") {
            alert("공지사항 제목을 입력해주세요.");
            return;
        }

        if (editContent.trim() === "") {
            alert("공지사항 내용을 입력해주세요.");
            return;
        }

        if (isSaving) return;

        setIsSaving(true);

        try {

            await updateInfo(
                Number(id),
                editTitle.trim(),
                editContent.trim()
            );

            setItem(prev => ({
                ...prev,
                title: editTitle.trim(),
                content: editContent.trim()
            }));

            setIsEditing(false);

            alert("공지사항 수정 완료.");

        } catch (error) {

            console.error("공지사항 수정 오류:", error);
            alert("공지사항 수정에 실패했습니다.");

        } finally {
            setIsSaving(false);
        }

    };


    // 다른 공지사항 목록
    const otherInfo = [...info].reverse().filter(
        item => item.id !== Number(id)
    );

    // 페이지네이션
    const totalPages = Math.ceil(otherInfo.length / 5);
    const currentPage = Math.min(pages, Math.max(totalPages, 1));
    const start = (currentPage - 1) * 5;
    const end = start + 5;


    /* 공지사항 불러오는 중 */
    if (loading) {
        return (
            <main className="info-page info-detail-page">
                <h2>공지사항을 불러오는 중입니다...</h2>
            </main>
        );
    }

    /* 공지사항 조회 오류 */
    if (loadError) {
        return (
            <main className="info-page info-detail-page">
                <h2>공지사항을 불러오지 못했습니다.</h2>
                <button onClick={() => navigate("/info")}>
                    목록으로 돌아가기
                </button>
            </main>
        );
    }


    if (!item) {
        return (
            <main className="info-page info-detail-page">
                <h2>존재하지 않는 공지사항입니다.</h2>
                <button onClick={() => navigate("/info")}>
                    목록으로 돌아가기
                </button>
            </main>
        );
    }

    return (
        <main className="info-page info-detail-page">

            {/* 상세보기 상단 */}
            <div className="info-detail-header">

                <div>
                    <h1>공지사항 상세정보</h1>
                    <p>등록된 공지사항의 내용을 확인할 수 있습니다.</p>
                </div>

                <button onClick={() => navigate("/info")}>
                    목록으로
                </button>

            </div>

            {/* 공지사항 상세정보 */}
            <div className="info-detail-content">


                <div className="info-detail-row">
                    <strong>공지사항 제목</strong>

                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                        />
                    ) : (
                        <span>{item.title}</span>
                    )}

                </div>


                <div className="info-detail-row">
                    <strong>작성자</strong>
                    <span>{item.author}</span>
                </div>

                <div className="info-detail-row">
                    <strong>작성일자</strong>
                    <span>{item.date}</span>
                </div>

                <div className="info-detail-row">
                    <strong>조회수</strong>
                    <span>{item.views ?? 0}</span>
                </div>

                {/* 공지사항 내용 */}
                <div className="info-detail-description">

                    <h3>공지사항 내용</h3>

                    {isEditing ? (
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={8}
                        />
                    ) : (
                        <p>{item.content}</p>
                    )}

                </div>


            </div>


            {/* 공지사항 수정 버튼 */}
            <div className="info-detail-edit">

                {isEditing ? (
                    <>
                        <button
                            onClick={handleUpdate}
                            disabled={isSaving}
                        >
                            {isSaving ? "저장 중..." : "수정 완료"}
                        </button>

                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            취소
                        </button>
                    </>
                ) : (
                    <button onClick={handleEdit}>
                        수정
                    </button>
                )}

            </div>


            {/* 다른 공지사항 목록 */}
            <div className="detail-other info-detail-other">

                <h3>다른 공지사항</h3>

                <div className="info-list-head detail-columns">
                    <div className="info-head-title">
                        <span>번호</span>
                        <span>제목</span>
                    </div>
                    <span>작성자</span>
                </div>

                <ol className="info-list">
                    {otherInfo.slice(start, end).map((other, index) => (
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
                    ))}
                </ol>

                {otherInfo.length === 0 &&
                    <p className="info-empty">
                        다른 공지사항이 없습니다.
                    </p>
                }

                {totalPages > 1 &&
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
                }

            </div>

            {/* 하단 버튼 */}
            <div className="info-detail-bottom">
                <button
                    className="info-detail-back"
                    onClick={() => navigate("/info")}
                >
                    공지사항 목록으로 돌아가기
                </button>
            </div>

        </main>
    );
}

export default Info_detail;
