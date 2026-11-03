import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import { Link } from "react-router-dom";

function MyComments(props) {
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    const authorId = props.loginUser.id;
    const commentsPerPage = 10;

    // ===================================
    // 내가 작성한 댓글 조회
    // ===================================

    useEffect(function () {
        let cancelled = false;

        async function loadComments() {
            setIsLoading(true);
            setLoadError("");

            try {
                const response = await axios.get(
                    API_BASE + "/api/community-comments/mine",
                    {
                        params: {
                            authorId: authorId
                        }
                    }
                );

                if (!cancelled) {
                    setComments(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError("내 댓글을 불러오지 못했습니다.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadComments();

        return function () {
            cancelled = true;
        };
    }, [authorId, retryCount]);

    function retryLoad() {
        setRetryCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    // ===================================
    // 페이지 계산
    // ===================================

    let totalPages = Math.ceil(
        comments.length / commentsPerPage
    );

    if (totalPages === 0) {
        totalPages = 1;
    }

    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;

    const currentComments = comments.slice(startIndex, endIndex);

    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    function showPreviousPage() {
        if (currentPage > 1) {
            setPage(currentPage - 1);
        }
    }

    function showNextPage() {
        if (currentPage < totalPages) {
            setPage(currentPage + 1);
        }
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("ko-KR");
    }

    // ===================================
    // 페이지 버튼
    // ===================================

    let pagination = null;

    if (totalPages > 1) {
        pagination = (
            <nav
                className="community-home-pagination"
                aria-label="내 댓글 페이지"
            >
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={showPreviousPage}
                >
                    이전
                </button>

                {pageNumbers.map(function (pageNumber) {
                    let buttonClass = "";
                    let currentPageLabel;

                    if (pageNumber === currentPage) {
                        buttonClass = "community-home-page-active";
                        currentPageLabel = "page";
                    }

                    function movePage() {
                        setPage(pageNumber);
                    }

                    return (
                        <button
                            key={pageNumber}
                            type="button"
                            className={buttonClass}
                            aria-current={currentPageLabel}
                            onClick={movePage}
                        >
                            {pageNumber}
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={showNextPage}
                >
                    다음
                </button>
            </nav>
        );
    }

    // ===================================
    // 로딩 / 오류 / 댓글 없음
    // ===================================

    if (isLoading) {
        return (
            <p className="community-empty" role="status">
                내 댓글을 불러오는 중입니다.
            </p>
        );
    }

    if (loadError !== "") {
        return (
            <div>
                <p role="alert">{loadError}</p>

                <button
                    type="button"
                    className="community-button"
                    onClick={retryLoad}
                >
                    다시 시도
                </button>
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <p className="community-empty">
                아직 작성한 댓글이 없습니다.
            </p>
        );
    }

    return (
        <div>
            <p className="community-home-count">
                전체 {comments.length}개
            </p>

            <ul className="activity-comment-list">
                {currentComments.map(function (comment) {
                    return (
                        <li
                            key={comment.id}
                            className="activity-comment-card"
                        >
                            <div className="activity-comment-top">
                                <span
                                    className="activity-board-badge"
                                    data-board={comment.boardName}
                                >
                                    {comment.boardName}
                                </span>

                                <span className="activity-comment-date">
                                    {formatDate(comment.createdAt)}
                                </span>
                            </div>

                            <p className="activity-comment-message">
                                {comment.content}
                            </p>

                            <Link
                                to={"/community/post/" + comment.postId}
                                className="activity-original-link"
                            >
                                <span className="activity-original-label">
                                    댓글을 남긴 글
                                </span>

                                <span className="activity-original-title">
                                    {comment.postTitle}
                                </span>

                                <span className="activity-original-action">
                                    대화 이어보기 ↗
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {pagination}
        </div>
    );
}

export default MyComments;