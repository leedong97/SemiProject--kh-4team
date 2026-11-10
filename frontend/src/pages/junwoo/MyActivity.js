import React, { useEffect, useState } from "react";
import MyComments from "./MyComments";
import MyBookmarks from "./MyBookmarks";
import { Link } from "react-router-dom";
import ActivitySummary from "./ActivitySummary";
import "./MyActivity.css";

function MyActivity(props) {

    let activity = "내가 작성한 글";

    if (props.activity) {
        activity = props.activity;
    }

    const [page, setPage] = useState(1);

    // 활동 메뉴 또는 로그인 사용자가 바뀌면 첫 페이지부터 표시
    useEffect(() => {
        setPage(1);
    }, [activity, props.loginUser.id]);

    const postsPerPage = 10;
    const loginUser = props.loginUser;

    // ===================================
    // 내가 작성한 글만 가져오기
    // ===================================

    const myPosts = props.posts.filter(function (post) {
        if (loginUser.isDummy || loginUser.id == null) {
            return false;
        }

        if (post.authorId == null) {
            return false;
        }

        return String(post.authorId) === String(loginUser.id);
    });

    // 최신순 정렬
    myPosts.sort(function (a, b) {
        let aTime = 0;
        let bTime = 0;

        if (a.createdAt) {
            aTime = new Date(a.createdAt).getTime();
        }

        if (b.createdAt) {
            bTime = new Date(b.createdAt).getTime();
        }

        return bTime - aTime;
    });

    // 내가 작성한 질문 중 해결 완료된 글
    const resolvedPosts = myPosts.filter(function (post) {
        return (
            post.boardName === "질문 답변" &&
            Number(post.isResolved) === 1
        );
    });

    // 현재 선택한 메뉴에 맞는 목록
    const visiblePosts =
        activity === "해결 완료한 질문"
            ? resolvedPosts
            : myPosts;

    // ===================================
    // 페이지 계산
    // ===================================

    let totalPages = Math.ceil(visiblePosts.length / postsPerPage);

    if (totalPages === 0) {
        totalPages = 1;
    }

    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;

    const currentPosts = visiblePosts.slice(startIndex, endIndex);

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

    // ===================================
    // 날짜 표시
    // ===================================

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        return date.toLocaleDateString("ko-KR");
    }

    // ===================================
    // 선택한 메뉴 스타일
    // ===================================

    let postsClass = "community-tab-button";
    let commentsClass = "community-tab-button";
    let bookmarksClass = "community-tab-button";
    let resolvedClass = "community-tab-button";

    if (activity === "내가 작성한 글") {
        postsClass += " community-tab-selected";
    } else if (activity === "내가 작성한 댓글") {
        commentsClass += " community-tab-selected";
    } else if (activity === "북마크한 글") {
        bookmarksClass += " community-tab-selected";
    } else if (activity === "해결 완료한 질문") {
        resolvedClass += " community-tab-selected";
    }

    // ===================================
    // 페이지 버튼
    // ===================================

    let pagination = null;

    if (totalPages > 1) {
        pagination = (
            <nav
                className="community-home-pagination"
                aria-label={`${activity} 페이지`}
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
    // 활동 내용
    // ===================================

    let activityContent;

    if (loginUser.isDummy || loginUser.id == null) {
        activityContent = (
            <p className="community-empty">
                로그인한 뒤 내 활동을 확인해주세요.
            </p>
        );
    } else if (activity === "내가 작성한 댓글") {
        activityContent = (
            <MyComments loginUser={loginUser} />
        );
    } else if (activity === "북마크한 글") {
        activityContent = (
            <MyBookmarks
                key={String(loginUser.id)}
                loginUser={loginUser}
            />
        );
    } else if (visiblePosts.length === 0) {
        activityContent = (
            <p className="community-empty">
                {activity === "해결 완료한 질문"
                    ? "아직 해결 완료된 질문이 없습니다."
                    : "아직 작성한 게시글이 없습니다."}
            </p>
        );
    } else {
        activityContent = (
            <div>
                <div className="community-home-table-wrap">
                    <table className="community-home-table">
                        <thead>
                            <tr>
                                <th scope="col">번호</th>
                                <th scope="col">게시판</th>
                                <th scope="col">제목</th>
                                <th scope="col">작성일</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentPosts.map(function (post, index) {
                                const number = startIndex + index + 1;

                                return (
                                    <tr key={post.id}>
                                        <td>{number}</td>

                                        <td>
                                            <span
                                                className="activity-board-badge"
                                                data-board={post.boardName}
                                            >
                                                {post.boardName}
                                            </span>
                                        </td>

                                        <td className="community-home-post-title">
                                            <Link
                                                to={"/community/post/" + post.id}
                                                className="community-home-title-button"
                                            >
                                                {post.title}
                                            </Link>
                                        </td>

                                        <td>
                                            {formatDate(post.createdAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {pagination}
            </div>
        );
    }

    let countLabel = "";

    if (
        (
            activity === "내가 작성한 글" ||
            activity === "해결 완료한 질문"
        ) &&
        !loginUser.isDummy &&
        loginUser.id != null
    ) {
        countLabel = "전체 " + visiblePosts.length + "개";
    }

    if (
        activity === "내가 작성한 글" &&
        !loginUser.isDummy &&
        loginUser.id != null
    ) {
        countLabel = "전체 " + myPosts.length + "개";
    }

    return (
        <div className="community-activity activity-page">
            <h1 className="community-title">
                내 활동
            </h1>

            <p className="community-description">
                내가 작성한 이야기를 한곳에서 확인하세요.
            </p>

            <ActivitySummary
                key={String(loginUser.id)}
                loginUser={loginUser}
                myPosts={myPosts}
            />

            <div className="community-tabs activity-tabs">
                <Link
                    to="/community/activity"
                    className={postsClass}
                >
                    <span aria-hidden="true">✍️ </span>
                    내가 작성한 글
                </Link>

                <Link
                    to="/community/activity/comments"
                    className={commentsClass}
                >
                    <span aria-hidden="true">💬 </span>
                    내가 작성한 댓글
                </Link>

                <Link
                    to="/community/activity/bookmarks"
                    className={bookmarksClass}
                >
                    <span aria-hidden="true">★ </span>
                    북마크한 글
                </Link>

                <Link
                    to="/community/activity/resolved"
                    className={resolvedClass}
                >
                    <span aria-hidden="true">✓ </span>
                    해결 완료한 질문
                </Link>
            </div>

            <div className="community-panel activity-list-panel">
                <div className="community-board-header">
                    <h2 className="community-panel-title">
                        {activity}
                    </h2>

                    <span className="community-home-count">
                        {countLabel}
                    </span>
                </div>

                {activityContent}
            </div>
        </div>
    );
}

export default MyActivity;