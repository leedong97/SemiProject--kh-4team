import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE } from "../../shared/config";

function MyBookmarks(props) {
    const [bookmarks, setBookmarks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [page, setPage] = useState(1);

    const employeeId = props.loginUser.id;
    const postsPerPage = 10;

    useEffect(function () {
        let cancelled = false;

        async function loadBookmarks() {
            setIsLoading(true);
            setLoadError("");

            try {
                const response = await axios.get(
                    API_BASE + "/api/community-bookmarks/mine",
                    {
                        params: {
                            employeeId: employeeId
                        }
                    }
                );

                if (!cancelled) {
                    setBookmarks(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(
                        error.response?.data?.message ||
                        "저장한 글을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadBookmarks();

        return function () {
            cancelled = true;
        };
    }, [employeeId, retryCount]);

    function retryLoad() {
        setRetryCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    // 한 페이지에 10개씩 표시
    const totalPages = Math.max(
        1,
        Math.ceil(bookmarks.length / postsPerPage)
    );

    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * postsPerPage;

    const currentBookmarks = bookmarks.slice(
        startIndex,
        startIndex + postsPerPage
    );

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleDateString("ko-KR");
    }

    if (isLoading) {
        return (
            <p className="community-empty" role="status">
                저장한 글을 불러오는 중입니다.
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

    if (bookmarks.length === 0) {
        return (
            <p className="community-empty">
                아직 저장한 글이 없습니다.
                다시 보고 싶은 글에 북마크를 눌러보세요.
            </p>
        );
    }

    return (
        <div>
            <p className="community-home-count">
                전체 {bookmarks.length}개
            </p>

            <div className="community-home-table-wrap">
                <table className="community-home-table">
                    <thead>
                        <tr>
                            <th scope="col">번호</th>
                            <th scope="col">게시판</th>
                            <th scope="col">제목</th>
                            <th scope="col">작성자</th>
                            <th scope="col">저장일</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentBookmarks.map(function (bookmark, index) {
                            return (
                                <tr key={bookmark.bookmarkId}>
                                    <td>{startIndex + index + 1}</td>

                                    <td>
                                        <span
                                            className="activity-board-badge"
                                            data-board={bookmark.boardName}
                                        >
                                            {bookmark.boardName}
                                        </span>
                                    </td>

                                    <td className="community-home-post-title">
                                        <Link
                                            to={"/community/post/" + bookmark.postId}
                                            className="community-home-title-button"
                                        >
                                            {bookmark.title}
                                        </Link>
                                    </td>

                                    <td>{bookmark.authorName}</td>

                                    <td>
                                        {formatDate(bookmark.bookmarkedAt)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <nav
                    className="community-home-pagination"
                    aria-label="저장한 글 페이지"
                >
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        이전
                    </button>

                    <span>
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        다음
                    </button>
                </nav>
            )}
        </div>
    );
}

export default MyBookmarks;