import React, { useState } from "react";
import CommunityPostDetail from "./CommunityPostDetail";
import MyComments from "./MyComments";

function MyActivity(props) {
    const [activity, setActivity] = useState("내가 작성한 글");
    const [page, setPage] = useState(1);
    const [selectedPost, setSelectedPost] = useState(null);

    const postsPerPage = 10;
    const loginUser = props.loginUser;

    // ===================================
    // 내 활동 메뉴 변경
    // ===================================

    function showMyPosts() {
        setActivity("내가 작성한 글");
        setPage(1);
        setSelectedPost(null);
    }

    function showMyComments() {
        setActivity("내가 작성한 댓글");
        setPage(1);
        setSelectedPost(null);
    }

    function showDetail(post) {
        setSelectedPost(post);
    }

    function showList() {
        setSelectedPost(null);
    }

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

    // ===================================
    // 페이지 계산
    // ===================================

    let totalPages = Math.ceil(myPosts.length / postsPerPage);

    if (totalPages === 0) {
        totalPages = 1;
    }

    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;

    const currentPosts = myPosts.slice(startIndex, endIndex);

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

    if (activity === "내가 작성한 글") {
        postsClass += " community-tab-selected";
    } else {
        commentsClass += " community-tab-selected";
    }

    // ===================================
    // 페이지 버튼
    // ===================================

    let pagination = null;

    if (totalPages > 1) {
        pagination = (
            <nav
                className="community-home-pagination"
                aria-label="내가 작성한 글 페이지"
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
            <MyComments
                loginUser={loginUser}
                posts={props.posts}
                onOpenPost={showDetail}
            />
        );
    } else if (myPosts.length === 0) {
        activityContent = (
            <p className="community-empty">
                아직 작성한 게시글이 없습니다.
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

                                function openPost() {
                                    showDetail(post);
                                }

                                return (
                                    <tr key={post.id}>
                                        <td>{number}</td>

                                        <td>{post.boardName}</td>

                                        <td className="community-home-post-title">
                                            <button
                                                type="button"
                                                className="community-home-title-button"
                                                onClick={openPost}
                                            >
                                                {post.title}
                                            </button>
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
        activity === "내가 작성한 글" &&
        !loginUser.isDummy &&
        loginUser.id != null
    ) {
        countLabel = "전체 " + myPosts.length + "개";
    }

    // 선택한 글이 있으면 상세보기
    if (selectedPost !== null) {
        return (
            <CommunityPostDetail
                post={selectedPost}
                onBack={showList}
            />
        );
    }

    return (
        <div className="community-activity">
            <h1 className="community-title">
                내 활동
            </h1>

            <p className="community-description">
                내가 작성한 이야기를 한곳에서 확인하세요.
            </p>

            <div className="community-tabs">
                <button
                    type="button"
                    className={postsClass}
                    onClick={showMyPosts}
                >
                    내가 작성한 글
                </button>

                <button
                    type="button"
                    className={commentsClass}
                    onClick={showMyComments}
                >
                    내가 작성한 댓글
                </button>
            </div>

            <div className="community-panel">
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