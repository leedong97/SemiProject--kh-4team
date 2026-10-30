import React, { useState } from "react";
import CommunityPostDetail from "./CommunityPostDetail";

function CommunityHome(props) {
    const [page, setPage] = useState(1);
    const [selectedBoard, setSelectedBoard] = useState("전체");
    const [searchText, setSearchText] = useState("");

    function changeBoard(event) {
        setSelectedBoard(event.target.value);
        setPage(1);
    }

    function changeSearch(event) {
        setSearchText(event.target.value);
        setPage(1);
    }

    function resetSearch() {
        setSelectedBoard("전체");
        setSearchText("");
        setPage(1);
    }

    function openFreeBoard() {
        props.onSelectBoard("자유게시판");
    }

    function openQuestionBoard() {
        props.onSelectBoard("질문 답변");
    }

    function openInfoBoard() {
        props.onSelectBoard("정보공유");
    }

    // 한 페이지에 보여줄 게시글 수
    const postsPerPage = 10;

    // 클릭한 게시글 저장
    const [selectedPost, setSelectedPost] = useState(null);

    // 상세 화면 열기
    function showDetail(post) {
        setSelectedPost(post);
    }

    // 목록으로 돌아가기
    function showList() {
        setSelectedPost(null);
    }

    // 앞뒤 공백을 제거하고 소문자로 변환
    const keyword = searchText.trim().toLowerCase();

    // 게시판과 검색어에 맞는 글만 가져오기
    const sortedPosts = props.posts.filter(function (post) {
        let matchesBoard = false;
        let matchesSearch = false;

        // 게시판 확인
        if (selectedBoard === "전체") {
            matchesBoard = true;
        } else if (post.boardName === selectedBoard) {
            matchesBoard = true;
        }

        // 검색할 제목과 내용
        let title = "";
        let content = "";

        if (post.title) {
            title = post.title.toLowerCase();
        }

        if (post.content) {
            content = post.content.toLowerCase();
        }

        // 검색어 확인
        if (keyword === "") {
            matchesSearch = true;
        } else if (title.includes(keyword)) {
            matchesSearch = true;
        } else if (content.includes(keyword)) {
            matchesSearch = true;
        }

        return matchesBoard && matchesSearch;
    });

    // 전체 페이지 수 계산
    let totalPages = Math.ceil(
        sortedPosts.length / postsPerPage
    );

    if (totalPages === 0) {
        totalPages = 1;
    }

    // 글 삭제로 전체 페이지 수가 줄어든 경우 처리
    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    // 현재 페이지에 해당하는 글만 가져오기
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;

    const currentPosts = sortedPosts.slice(startIndex, endIndex);

    // 페이지 번호 배열 만들기
    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // 이전 페이지로 이동
    function showPreviousPage() {
        if (currentPage > 1) {
            setPage(currentPage - 1);
        }
    }

    // 다음 페이지로 이동
    function showNextPage() {
        if (currentPage < totalPages) {
            setPage(currentPage + 1);
        }
    }

    // 작성일 표시
    function formatDate(value) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return year + "." + month + "." + day;
    }

    // 게시판별 글 개수
    const freeCount = props.posts.filter(function (post) {
        return post.boardName === "자유게시판";
    }).length;

    const questionCount = props.posts.filter(function (post) {
        return post.boardName === "질문 답변";
    }).length;

    const infoCount = props.posts.filter(function (post) {
        return post.boardName === "정보공유";
    }).length;

    let emptyTitle = "아직 등록된 이야기가 없어요";
    let emptyDescription =
        "게시판에서 동료들과 나눌 첫 이야기를 작성해보세요.";

    if (props.posts.length > 0) {
        emptyTitle = "조건에 맞는 게시글이 없어요";
        emptyDescription =
            "다른 게시판을 선택하거나 검색어를 바꿔보세요.";
    }

    // ===================================
    // 게시글 목록 화면
    // ===================================

    let postContent;

    if (sortedPosts.length === 0) {
        postContent = (
            <div className="lounge-empty">
                <span className="lounge-empty-icon" aria-hidden="true">
                    ✎
                </span>

                <h3>{emptyTitle}</h3>

                <p>{emptyDescription}</p>

                <button
                    type="button"
                    className="lounge-hero-button"
                    onClick={props.onShowBoard}
                >
                    게시판으로 이동 →
                </button>
            </div>
        );
    } else {
        postContent = (
            <ul className="lounge-feed">
                {currentPosts.map(function (post, index) {
                    const number = startIndex + index + 1;

                    let badgeClass = "lounge-post-badge";

                    if (post.boardName === "질문 답변") {
                        badgeClass += " lounge-post-badge-question";
                    } else if (post.boardName === "정보공유") {
                        badgeClass += " lounge-post-badge-info";
                    }

                    let authorName = "작성자 미등록";

                    if (post.authorName) {
                        authorName = post.authorName;
                    }

                    let previewText = "";

                    if (post.content) {
                        previewText = post.content;
                    }

                    function openPost() {
                        showDetail(post);
                    }

                    return (
                        <li
                            key={post.id}
                            className="lounge-feed-item"
                        >
                            <span className="lounge-feed-number">
                                {number}
                            </span>

                            <div className="lounge-feed-body">
                                <span className={badgeClass}>
                                    {post.boardName}
                                </span>

                                <h3 className="lounge-feed-title">
                                    <button
                                        type="button"
                                        className="lounge-feed-title-button"
                                        onClick={openPost}
                                    >
                                        {post.title}
                                    </button>
                                </h3>

                                <p className="lounge-feed-preview">
                                    {previewText}
                                </p>

                                <div className="lounge-feed-meta">
                                    <span>{authorName}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                        {formatDate(post.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <span
                                className="lounge-feed-arrow"
                                aria-hidden="true"
                            >
                                ›
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // ===================================
    // 페이지 이동 버튼
    // ===================================

    let pagination = null;

    if (totalPages > 1) {
        pagination = (
            <nav
                className="community-home-pagination"
                aria-label="게시글 페이지"
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

    if (selectedPost !== null) {
        return (
            <CommunityPostDetail
                post={selectedPost}
                onBack={showList}
            />
        );
    }

    return (
        <div className="lounge-home-grid">
            {/* 왼쪽: 최신 게시글 */}
            <div className="community-panel lounge-feed-panel">
                <div className="community-board-header">
                    <h2 className="community-panel-title">
                        최신 게시글
                    </h2>

                    <span className="community-home-count">
                        조회 {sortedPosts.length}개
                    </span>
                </div>

                <div className="lounge-search-toolbar">
                    <select
                        className="lounge-board-select"
                        aria-label="게시판 선택"
                        value={selectedBoard}
                        onChange={changeBoard}
                    >
                        <option value="전체">전체 게시판</option>
                        <option value="자유게시판">자유게시판</option>
                        <option value="질문 답변">질문 답변</option>
                        <option value="정보공유">정보공유</option>
                    </select>

                    <input
                        type="search"
                        className="lounge-search-input"
                        aria-label="제목 또는 내용 검색"
                        placeholder="제목이나 내용을 검색하세요"
                        value={searchText}
                        onChange={changeSearch}
                    />

                    <button
                        type="button"
                        className="lounge-search-reset"
                        onClick={resetSearch}
                    >
                        초기화
                    </button>
                </div>

                {postContent}

                {pagination}
            </div>

            {/* 오른쪽: 현황과 안내 */}
            <aside className="lounge-home-side">
                <section className="lounge-side-card">
                    <h2 className="lounge-side-title">
                        우리들의 이야기
                    </h2>

                    <p className="lounge-side-description">
                        게시판에 모인 이야기를 확인하세요.
                    </p>

                    <div className="lounge-total-posts">
                        <span>전체 게시글</span>
                        <strong>{props.posts.length}개</strong>
                    </div>

                    <ul className="lounge-board-counts">
                        <li>
                            <button
                                type="button"
                                className="lounge-board-shortcut"
                                onClick={openFreeBoard}
                            >
                                <span>
                                    <span
                                        className="lounge-category-dot lounge-dot-free"
                                        aria-hidden="true"
                                    />
                                    자유게시판
                                </span>

                                <strong>{freeCount}개 →</strong>
                            </button>
                        </li>

                        <li>
                            <button
                                type="button"
                                className="lounge-board-shortcut"
                                onClick={openQuestionBoard}
                            >
                                <span>
                                    <span
                                        className="lounge-category-dot lounge-dot-question"
                                        aria-hidden="true"
                                    />
                                    질문 답변
                                </span>

                                <strong>{questionCount}개 →</strong>
                            </button>
                        </li>

                        <li>
                            <button
                                type="button"
                                className="lounge-board-shortcut"
                                onClick={openInfoBoard}
                            >
                                <span>
                                    <span
                                        className="lounge-category-dot lounge-dot-info"
                                        aria-hidden="true"
                                    />
                                    정보공유
                                </span>

                                <strong>{infoCount}개 →</strong>
                            </button>
                        </li>
                    </ul>

                    <button
                        type="button"
                        className="lounge-side-button"
                        onClick={props.onShowBoard}
                    >
                        게시판 둘러보기 →
                    </button>
                </section>

                <section className="lounge-side-card">
                    <h2 className="lounge-side-title">
                        함께 지키는 이용 안내
                    </h2>

                    <ul className="lounge-guide-list">
                        <li>
                            <span className="lounge-guide-number">01</span>

                            <div>
                                <strong>서로 존중해요</strong>
                                <p>
                                    다른 의견에도 배려하는 말로 대화해주세요.
                                </p>
                            </div>
                        </li>

                        <li>
                            <span className="lounge-guide-number">02</span>

                            <div>
                                <strong>정보를 안전하게 나눠요</strong>
                                <p>
                                    개인정보와 회사의 민감한 정보는 올리지 말아주세요.
                                </p>
                            </div>
                        </li>

                        <li>
                            <span className="lounge-guide-number">03</span>

                            <div>
                                <strong>주제에 맞게 작성해요</strong>
                                <p>
                                    질문은 질문 답변에, 유용한 자료는 정보공유에 남겨주세요.
                                </p>
                            </div>
                        </li>
                    </ul>
                </section>

                <section className="lounge-welcome-card">
                    <span className="lounge-welcome-label">
                        TOGETHER IS BETTER
                    </span>

                    <h2>작은 이야기도 환영해요.</h2>

                    <p>
                        오늘 알게 된 팁 하나,
                        <br />
                        동료에게 전하고 싶은 한마디.
                        <br />
                        여러분의 이야기로 채워주세요.
                    </p>
                </section>
            </aside>
        </div>
    );
}

export default CommunityHome;