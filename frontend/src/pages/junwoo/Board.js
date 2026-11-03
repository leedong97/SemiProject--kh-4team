import React, { useState, useRef, useCallback } from "react";
import PostForm from "./PostForm";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";
import CommunityComments from "./CommunityComments";
import CommunityLike from "./CommunityLike";
import { Link, useParams, useNavigate } from "react-router-dom";
import BoardBanner from "./BoardBanner";

function Board(props) {

    const currentUser = getLoginUser();

    const setPosts = props.setPosts;

    // 해당 게시글의 댓글 수를 목록에도 반영
    const updateCommentCount = useCallback(function (postId, count) {
        setPosts(function (previousPosts) {
            return previousPosts.map(function (post) {
                if (String(post.id) !== String(postId)) {
                    return post;
                }

                // 개수가 같으면 기존 데이터 유지
                if (Number(post.commentCount) === count) {
                    return post;
                }

                return {
                    ...post,
                    commentCount: count
                }
            })
        })
    }, [setPosts]);

    // 중복 등록 방지
    const savingRef = useRef(false);

    // 화면에 표시할 저장 상태
    const [isSaving, setIsSaving] = useState(false);

    // 페이지네이션 기능
    const [page, setPage] = useState(1);
    const postsPerPage = 10;

    const [searchText, setSearchText] = useState("");
    const [questionFilter, setQuestionFilter] = useState("전체");

    const params = useParams();
    const navigate = useNavigate();

    // 기본 화면은 목록
    let screen = "list";

    if (props.screen) {
        screen = props.screen;
    }

    // 기본 게시판은 자유게시판
    let boardName = "자유게시판";

    if (params.boardCode === "question") {
        boardName = "질문 답변";
    } else if (params.boardCode === "info") {
        boardName = "정보공유";
    }

    // 주소에 글 번호가 있는지 확인
    let postId = null;

    if (params.postId) {
        postId = params.postId;
    }

    let selectedPost = null;

    // 글 번호가 없는 작성 화면이면 새 글
    if (screen === "form" && postId === null) {
        selectedPost = {
            id: null,
            title: "",
            content: "",
            boardName: boardName
        };
    } else if (postId !== null) {
        // 글 번호가 있으면 기존 글 찾기
        for (let i = 0; i < props.posts.length; i++) {
            const post = props.posts[i];

            if (String(post.id) === String(postId)) {
                selectedPost = post;
                break;
            }
        }
    }

    // 상세보기나 수정 화면은 해당 글의 게시판 사용
    if (selectedPost !== null) {
        boardName = selectedPost.boardName;
    }

    // 목록과 글쓰기 주소에 사용할 게시판 코드
    let boardCode = "free";

    if (boardName === "질문 답변") {
        boardCode = "question";
    } else if (boardName === "정보공유") {
        boardCode = "info";
    }

    const listAddress = "/community/board/" + boardCode;
    const writeAddress = "/community/write/" + boardCode;

    // ===================================
    // 게시판 변경
    // ===================================

    function changeBoard(nextBoardName) {
        setSearchText("");
        setPage(1);
        setQuestionFilter("전체");

        if (nextBoardName === "자유게시판") {
            navigate("/community/board/free");
        } else if (nextBoardName === "질문 답변") {
            navigate("/community/board/question");
        } else if (nextBoardName === "정보공유") {
            navigate("/community/board/info");
        }
    }

    function showFreeBoard() {
        changeBoard("자유게시판");
    }

    function showQuestionBoard() {
        changeBoard("질문 답변");
    }

    function showInfoBoard() {
        changeBoard("정보공유");
    }

    function changeSearch(event) {
        setSearchText(event.target.value);
        setPage(1);
    }

    function changeQuestionFilter(event) {
        setQuestionFilter(event.target.value);
        setPage(1);
    }

    function resetSearch() {
        setSearchText("");
        setQuestionFilter("전체");
        setPage(1);
    }

    // 질문 답변 글에만 상태 표시
    function renderQuestionStatus(post) {
        if (post.boardName !== "질문 답변") {
            return null;
        }

        let statusText = "답변 대기";
        let statusClass = "question-status question-status-waiting";

        if (Number(post.isResolved) === 1) {
            statusText = "해결 완료";
            statusClass = "question-status question-status-resolved";
        }

        return (
            <span className={statusClass}>
                {statusText}
            </span>
        );
    }

    async function changeResolution() {
        if (savingRef.current) {
            return;
        }

        if (
            selectedPost === null ||
            selectedPost.boardName !== "질문 답변"
        ) {
            return;
        }

        const loginUser = getLoginUser();

        if (
            loginUser.isDummy ||
            !loginUser.id ||
            String(selectedPost.authorId) !== String(loginUser.id)
        ) {
            alert("본인이 작성한 질문만 상태를 변경할 수 있습니다.");
            return;
        }

        let nextStatus = 1;

        if (Number(selectedPost.isResolved) === 1) {
            nextStatus = 0;
        }

        savingRef.current = true;

        try {
            const response = await axios.put(
                API_BASE + "/api/community/" + selectedPost.id + "/resolution",
                {
                    authorId: loginUser.id,
                    isResolved: nextStatus
                }
            );

            const updatedPost = response.data.post;

            // 전체 목록에 변경 결과 반영
            props.setPosts(function (previousPosts) {
                return previousPosts.map(function (post) {
                    if (String(post.id) === String(updatedPost.id)) {
                        return {
                            ...post,
                            ...updatedPost
                        };
                    }

                    return post;
                });
            });

        } catch (error) {
            let message = "질문 상태를 변경하지 못했습니다.";

            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                message = error.response.data.message;
            }

            alert(message);
        } finally {
            savingRef.current = false;
        }
    }

    // ===================================
    // 화면 이동
    // ===================================

    // 목록으로 이동
    function showList() {
        navigate(listAddress);
    }

    // ===================================
    // 게시글 저장
    // title과 content는 PostForm에서 전달
    // ===================================

    async function savePost(title, content) {
        if (savingRef.current) {
            return;
        }

        const loginUser = getLoginUser();

        if (loginUser.isDummy || !loginUser.id) {
            alert("직원 계정으로 로그인해주세요.");
            return;
        }

        const isNewPost = selectedPost.id === null;

        // 수정할 때 작성자 확인
        if (!isNewPost) {
            if (String(selectedPost.authorId) !== String(loginUser.id)) {
                alert("본인이 작성한 글만 수정할 수 있습니다.");
                return;
            }
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            let response;

            if (isNewPost) {
                // 새 글 등록
                response = await axios.post(
                    API_BASE + "/api/community",
                    {
                        boardName: boardName,
                        title: title,
                        content: content,
                        authorId: loginUser.id
                    }
                );
            } else {
                // 기존 글 수정
                response = await axios.put(
                    API_BASE + "/api/community/" + selectedPost.id,
                    {
                        title: title,
                        content: content,
                        authorId: loginUser.id
                    }
                );
            }

            const savedPost = response.data.post;

            // 서버 저장이 성공한 뒤 화면 목록 변경
            props.setPosts(function (previousPosts) {
                if (isNewPost) {
                    const nextPosts = previousPosts.slice();

                    nextPosts.unshift(savedPost);

                    return nextPosts;
                }

                return previousPosts.map(function (post) {
                    if (String(post.id) === String(savedPost.id)) {
                        return {
                            ...post,
                            ...savedPost
                        };
                    }

                    return post;
                });
            });

            if (isNewPost) {
                setSearchText("");
                setQuestionFilter("전체");
                setPage(1);
            }

            showList();
        } catch (error) {
            let message = "게시글 저장에 실패했습니다.";

            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                message = error.response.data.message;
            }

            alert(message);
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    // ===================================
    // 게시글 삭제
    // ===================================

    async function deletePost() {
        if (savingRef.current) {
            return;
        }

        const loginUser = getLoginUser();

        if (loginUser.isDummy || !loginUser.id) {
            alert("직원 계정으로 로그인해주세요.");
            return;
        }

        if (String(selectedPost.authorId) !== String(loginUser.id)) {
            alert("본인이 작성한 글만 삭제할 수 있습니다.");
            return;
        }

        const answer = window.confirm("이 글을 삭제할까요?");

        if (answer === false) {
            return;
        }

        const postId = selectedPost.id;

        savingRef.current = true;

        try {
            // axios.delete는 data 안에 요청 본문을 넣어요.
            await axios.delete(
                API_BASE + "/api/community/" + postId,
                {
                    data: {
                        authorId: loginUser.id
                    }
                }
            );

            // DB 삭제 성공 후 화면에서도 제거
            props.setPosts(function (previousPosts) {
                return previousPosts.filter(function (post) {
                    return String(post.id) !== String(postId);
                });
            });

            showList();
        } catch (error) {
            let message = "게시글 삭제에 실패했습니다.";

            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                message = error.response.data.message;
            }

            alert(message);
        } finally {
            savingRef.current = false;
        }
    }

    // ===================================
    // 현재 게시판의 글만 가져오기
    // ===================================

    const keyword = searchText.trim().toLowerCase();

    const boardPosts = props.posts.filter(function (post) {
        if (post.boardName !== boardName) {
            return false;
        }

        // 질문 답변 게시판에서만 상태 필터 적용
        if (boardName === "질문 답변") {
            if (
                questionFilter === "답변 대기" &&
                Number(post.isResolved) === 1
            ) {
                return false;
            }

            if (
                questionFilter === "해결 완료" &&
                Number(post.isResolved) !== 1
            ) {
                return false;
            }
        }

        // 검색어가 없으면 표시
        if (keyword === "") {
            return true;
        }

        // 이 아래 기존 제목·내용 검색 코드는 그대로

        // 검색어가 없으면 표시
        if (keyword === "") {
            return true;
        }

        let title = "";
        let content = "";

        if (post.title) {
            title = post.title.toLowerCase();
        }

        if (post.content) {
            content = post.content.toLowerCase();
        }

        // 제목 또는 내용에 검색어가 있으면 표시
        if (title.includes(keyword)) {
            return true;
        }

        if (content.includes(keyword)) {
            return true;
        }

        return false;
    });

    // 최신순 정렬
    boardPosts.sort(function (a, b) {
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

    let totalPages = Math.ceil(boardPosts.length / postsPerPage);

    if (totalPages === 0) {
        totalPages = 1;
    }

    // 마지막 페이지의 글을 삭제한 경우 처리
    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;

    const currentPosts = boardPosts.slice(startIndex, endIndex);

    // 페이지 번호 배열
    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // ===================================
    // 페이지 이동
    // ===================================

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

    let emptyMessage = "등록된 게시글이 없습니다.";

    if (
        keyword !== "" ||
        (boardName === "질문 답변" && questionFilter !== "전체")
    ) {
        emptyMessage = "선택한 조건에 맞는 게시글이 없습니다.";
    }

    // ===================================
    // 게시글 목록
    // ===================================

    let postList;

    if (boardPosts.length === 0) {
        postList = (
            <p className="community-empty">
                {emptyMessage}
            </p>
        );
    } else {
        postList = (
            <div className="community-board-table-wrap">
                <table className="community-board-table">
                    <thead>
                        <tr>
                            <th scope="col">번호</th>
                            <th scope="col">제목</th>
                            <th scope="col">작성자</th>
                            <th scope="col">작성일자</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentPosts.map(function (post, index) {
                            const number = startIndex + index + 1;

                            let authorName = "-";

                            if (post.authorName) {
                                authorName = post.authorName;
                            }

                            let createdDate = "-";

                            if (post.createdAt) {
                                const date = new Date(post.createdAt);
                                createdDate = date.toLocaleDateString("ko-KR");
                            }

                            return (
                                <tr key={post.id}>
                                    <td>{number}</td>

                                    <td className="community-board-title-cell">
                                        {renderQuestionStatus(post)}
                                        <Link
                                            className="community-board-title-button"
                                            to={"/community/post/" + post.id}
                                        >
                                            {post.title}

                                            {Number(post.commentCount) > 0 && (
                                                <span aria-label={`댓글 ${post.commentCount}개`}>
                                                    {" "} [{post.commentCount}]
                                                </span>
                                            )}
                                        </Link>
                                    </td>

                                    <td>
                                        <span className="board-author">
                                            <span className="board-author-avatar" aria-hidden="true">
                                                {authorName.slice(0, 1)}
                                            </span>

                                            <span>{authorName}</span>
                                        </span>
                                    </td>

                                    <td>{createdDate}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // ===================================
    // 페이지 번호 버튼
    // ===================================

    let pagination = null;

    if (totalPages > 1) {
        pagination = (
            <nav
                className="community-home-pagination"
                aria-label="게시판 페이지"
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
    // 선택한 게시판 버튼 표시
    // ===================================

    let freeClass = "community-tab-button";
    let questionClass = "community-tab-button";
    let infoClass = "community-tab-button";

    if (boardName === "자유게시판") {
        freeClass = freeClass + " community-tab-selected";
    } else if (boardName === "질문 답변") {
        questionClass = questionClass + " community-tab-selected";
    } else if (boardName === "정보공유") {
        infoClass = infoClass + " community-tab-selected";
    }

    // 본인 글일 때만 수정·삭제 버튼 준비
    let postActions = null;

    if (
        selectedPost !== null &&
        !currentUser.isDummy &&
        currentUser.id != null &&
        selectedPost.authorId != null
    ) {
        const authorId = String(selectedPost.authorId);
        const loginId = String(currentUser.id);

        if (authorId === loginId) {
            postActions = (
                <>
                    <Link
                        to={"/community/edit/" + selectedPost.id}
                        className="community-button"
                    >
                        수정
                    </Link>

                    <button
                        type="button"
                        className="community-delete-button"
                        onClick={deletePost}
                    >
                        삭제
                    </button>
                </>
            );
        }
    }

    let resolutionButton = null;

    if (
        selectedPost !== null &&
        selectedPost.boardName === "질문 답변" &&
        !currentUser.isDummy &&
        currentUser.id != null &&
        String(selectedPost.authorId) === String(currentUser.id)
    ) {
        let buttonText = "해결 완료로 변경";

        if (Number(selectedPost.isResolved) === 1) {
            buttonText = "답변 대기로 변경";
        }

        resolutionButton = (
            <button
                type="button"
                className="community-button"
                onClick={changeResolution}
            >
                {buttonText}
            </button>
        );
    }

    let questionFilterControl = null;

    if (boardName === "질문 답변") {
        questionFilterControl = (
            <select
                className="lounge-board-select"
                aria-label="질문 해결 상태"
                value={questionFilter}
                onChange={changeQuestionFilter}
            >
                <option value="전체">전체 상태</option>
                <option value="답변 대기">답변 대기</option>
                <option value="해결 완료">해결 완료</option>
            </select>
        );
    }

    // ===================================
    // 현재 보여줄 화면 선택
    // ===================================

    let boardContent;

    if (
        (screen === "detail" || screen === "form") &&
        selectedPost === null
    ) {
        boardContent = (
            <div className="community-panel">
                <p>게시글을 찾을 수 없습니다.</p>

                <Link
                    className="community-button"
                    to="/community/board"
                >
                    목록으로
                </Link>
            </div>
        );
    } else if (screen === "form") {
        let formKey = "new-" + boardCode;

        if (selectedPost.id !== null) {
            formKey = "edit-" + selectedPost.id;
        }

        boardContent = (
            <PostForm
                key={formKey}
                post={selectedPost}
                onSave={savePost}
                onCancel={showList}
                isSaving={isSaving}
            />
        );
    } else if (screen === "detail") {

        // 상세보기 화면
        boardContent = (
            <div className="community-panel">
                <h2 className="community-panel-title">
                    {selectedPost.title}
                </h2>

                {renderQuestionStatus(selectedPost)}

                <p className="community-post-content">
                    {selectedPost.content}
                </p>

                <CommunityLike
                    key={"like-" + selectedPost.id}
                    postId={selectedPost.id}
                />

                <CommunityComments
                    key={"comments-" + selectedPost.id}
                    postId={selectedPost.id}
                    onCountChange={updateCommentCount}
                />

                <div className="community-actions">
                    <Link
                        to={listAddress}
                        className="community-button"
                    >
                        목록
                    </Link>

                    {resolutionButton}
                    {postActions}
                </div>
            </div>
        );
    } else {
        // 목록 화면
        boardContent = (
            <div className={"community-panel board-list-panel board-theme-" + boardCode}>
                <BoardBanner
                    boardName={boardName}
                    writeAddress={writeAddress}
                />

                <div className="lounge-search-toolbar">
                    {questionFilterControl}
                    <input
                        type="search"
                        className="lounge-search-input"
                        aria-label="게시판 제목 또는 내용 검색"
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

                    <span className="community-home-count">
                        조회 {boardPosts.length}개
                    </span>
                </div>

                {postList}

                {pagination}
            </div>
        );
    }

    return (
        <div className="community-board">
            <h1 className="community-title">
                게시판
            </h1>

            <div className="community-tabs board-pretty-tabs">
                <button
                    type="button"
                    className={freeClass}
                    onClick={showFreeBoard}
                >
                    <span aria-hidden="true">💬 </span>
                    자유게시판
                </button>

                <button
                    type="button"
                    className={questionClass}
                    onClick={showQuestionBoard}
                >
                    <span aria-hidden="true">❔ </span>
                    질문 답변
                </button>

                <button
                    type="button"
                    className={infoClass}
                    onClick={showInfoBoard}
                >
                    <span aria-hidden="true">💡 </span>
                    정보공유
                </button>
            </div>

            {boardContent}
        </div>
    );
}

export default Board;