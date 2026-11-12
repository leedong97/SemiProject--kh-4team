import React, { Fragment, useEffect, useState } from "react";
import { adminRequest } from "../adminApi";
import usePagination from "../utils/usePagination";
import NumberedPager from "../components/NumberedPager";
import FilterChips from "../components/FilterChips";
import SearchSortBar from "../components/SearchSortBar";
import { compareText, compareNumber, descending, sortByOption } from "../utils/listSort";

const COMMUNITY_PAGE_SIZE = 10;

// 댓글을 원댓글 아래에 대댓글이 붙도록 정렬한다 (depth 0 = 원댓글, 1 = 대댓글)
// 원댓글이 없는 대댓글은 원댓글로 취급해 목록에 그대로 보여준다.
function arrangeComments(list) {
    const ids = new Set(list.map((c) => String(c.id)));
    const isReply = (c) => c.parentId != null && ids.has(String(c.parentId));
    const result = [];
    list.filter((c) => !isReply(c)).forEach((top) => {
        result.push({ ...top, depth: 0 });
        list
            .filter((c) => isReply(c) && String(c.parentId) === String(top.id))
            .forEach((reply) => result.push({ ...reply, depth: 1 }));
    });
    return result;
}

// 정렬 선택지 (프로젝트 관리·인원 관리와 같은 드롭다운 방식)
const SORT_OPTIONS = [
    { value: "default", label: "기본순 (오래된 순)" },
    { value: "latest", label: "최신순" },
    { value: "title", label: "제목순" },
    { value: "author", label: "작성자순" },
    { value: "comments", label: "댓글 많은순" },
];

// 커뮤니티 관리: 게시글과 댓글을 확인하고 삭제합니다.
// 관리자가 지운 글·댓글도 여기서는 '삭제됨' 표시와 함께 원래 내용을 볼 수 있습니다.
// (일반 커뮤니티 화면에는 여전히 '삭제된 댓글입니다.'만 보입니다.)
function Community() {
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState("");
    // 정렬 선택 (드롭다운)
    const [sortOption, setSortOption] = useState("default");
    // 삭제된 글만 보기
    const [deletedOnly, setDeletedOnly] = useState(false);
    // 게시판 선택 ("전체" 또는 게시판 이름)
    const [boardFilter, setBoardFilter] = useState("전체");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // { key, post, comments, isArchived } : key 는 목록에서 누른 줄의 번호
    const [detail, setDetail] = useState(null);

    async function loadPosts() {
        setLoading(true);
        setError("");
        try {
            const rows = await adminRequest("/community/posts");
            setPosts(Array.isArray(rows) ? rows : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // 살아 있는 글은 /community/posts/:id, 지워진 글은 보관본 /community/archive/:id 에서 읽는다
    async function openPost(item) {
        try {
            const data = item.isArchived
                ? await adminRequest(`/community/archive/${item.archiveId}`)
                : await adminRequest(`/community/posts/${item.id}`);
            setDetail({ ...data, key: item.id, isArchived: Boolean(item.isArchived) });
        } catch (err) {
            alert(err.message);
        }
    }

    async function deletePost(id) {
        if (!window.confirm("이 게시글을 삭제할까요? 댓글도 함께 삭제되며, 삭제된 글은 커뮤니티 관리에서 계속 확인할 수 있습니다.")) return;
        try {
            await adminRequest(`/community/posts/${id}`, { method: "DELETE" });
            setDetail(null);
            await loadPosts();
        } catch (err) {
            alert(err.message);
        }
    }

    async function deleteComment(commentId) {
        if (!window.confirm("이 댓글을 삭제할까요? 일반 화면에서는 '삭제된 댓글입니다.'로 보이고, 관리 화면에서는 원래 내용을 볼 수 있습니다.")) return;
        try {
            await adminRequest(`/community/comments/${commentId}`, { method: "DELETE" });
            await openPost({ id: detail.post.id, isArchived: false });
            await loadPosts();
        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => { loadPosts(); }, []);

    const keyword = search.trim().toLowerCase();
    // 게시판 목록 (글이 있는 게시판만, 가나다순)
    const boardNames = [...new Set(posts.map((p) => p.boardName).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "ko"));

    const filtered = posts
        .filter((p) => !keyword || String(p.title || "").toLowerCase().includes(keyword))
        .filter((p) => boardFilter === "전체" || p.boardName === boardFilter)
        .filter((p) => !deletedOnly || p.isArchived);
    // 기본: 오래된 글이 위로 (작성일 오름차순, 같은 날짜면 번호 오름차순)
    const byOldest = (a, b) =>
        compareText(a.createdAt, b.createdAt)
        || String(a.id).localeCompare(String(b.id), undefined, { numeric: true });

    // 선택한 항목 기준 정렬 (기본은 오래된 순)
    const sortRules = {
        default: byOldest,
        latest: descending(byOldest),
        title: (a, b) => compareText(a.title, b.title),
        author: (a, b) => compareText(a.authorName, b.authorName),
        comments: (a, b) => compareNumber(b.commentCount, a.commentCount) || byOldest(a, b),
    };
    const sorted = sortByOption(filtered, sortOption, sortRules);
    // 번호는 목록 순서대로 1부터 이어서 매긴다 (글을 지워도 번호 빈자리가 생기지 않는다)
    const numbered = sorted.map((p, index) => ({ ...p, displayNo: index + 1 }));

    // 한 페이지 10개씩 (검색어가 바뀌면 1페이지로)
    const { pageItems, currentPage, totalPages, total, goTo } =
        usePagination(numbered, COMMUNITY_PAGE_SIZE, [search, sortOption, deletedOnly, boardFilter]);
    const deletedCount = posts.filter((p) => p.isArchived).length;

    return (
        <div className="admin-boards">
            <div className="boards-header">


                <div className="boards-count">
                    전체 게시글<strong>{posts.length}건</strong>
                    <small className="nexus-community-deleted-count">삭제된 글 {deletedCount}건</small>
                </div>
            </div>

            <div className="boards-list">
                <div className="boards-list-header">
                    <h2>게시글 목록</h2>
                </div>
                <SearchSortBar
                    searchId="community-search"
                    placeholder="제목 검색"
                    search={search}
                    onSearchChange={setSearch}
                    selects={[
                        {
                            id: "community-board",
                            label: "게시판",
                            value: boardFilter,
                            onChange: setBoardFilter,
                            options: [
                                { value: "전체", label: "전체 게시판" },
                                ...boardNames.map((name) => ({ value: name, label: name })),
                            ],
                        },
                        { id: "community-sort", label: "정렬 기준", value: sortOption, onChange: setSortOption, options: SORT_OPTIONS },
                    ]}
                />

                {loading && <p>불러오는 중...</p>}
                {error && <p role="alert">서버 오류: {error}</p>}

                <FilterChips
                    label="삭제 여부 필터"
                    value={deletedOnly}
                    onChange={setDeletedOnly}
                    options={[
                        { value: false, label: "전체" },
                        { value: true, label: `삭제된 글 (${deletedCount})` },
                    ]}
                />

                <div className="boards-table-wrap">
                    <table className="boards-table">
                        <thead>
                            <tr>
                                <th>번호</th>
                                <th>게시판</th>
                                <th>제목</th>
                                <th>작성자</th>
                                <th>작성일</th>
                                <th>댓글</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="7" className="boards-empty">게시글이 없습니다.</td></tr>
                            ) : pageItems.map((p) => {
                                const isOpen = detail !== null && String(detail.key) === String(p.id);
                                return (
                                    <Fragment key={p.id}>
                                        <tr>
                                            <td>
                                                {p.displayNo}
                                            </td>
                                            <td>{p.boardName}</td>
                                            <td className="boards-title-cell">
                                                {p.isArchived && <span className="nexus-deleted-badge">삭제됨</span>}
                                                {p.title}
                                            </td>
                                            <td>{p.authorName}{p.isAnonymous ? '(익명)' : ''}</td>
                                            <td>{p.createdAt}</td>
                                            <td>{p.commentCount}</td>
                                            <td><div className="boards-actions">
                                                <button type="button" onClick={() => (isOpen ? setDetail(null) : openPost(p))}>
                                                    {isOpen ? "접기" : "보기"}
                                                </button>
                                                {!p.isArchived && (
                                                    <button type="button" className="boards-delete" onClick={() => deletePost(p.id)}>삭제</button>
                                                )}
                                            </div></td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="boards-detail-row">
                                                <td colSpan="7">
                                                    <div className="boards-detail-panel">
                                                        <div className="boards-list-header">
                                                            <h2>
                                                                {detail.isArchived && <span className="nexus-deleted-badge">삭제된 게시글입니다.</span>}
                                                                {detail.post.title}
                                                            </h2>
                                                            <button type="button" onClick={() => setDetail(null)}>닫기</button>
                                                        </div>
                                                        <p>{detail.post.boardName} · {detail.post.authorName}{detail.post.isAnonymous ? '(익명)' : ''} · {detail.post.createdAt}</p>
                                                        <p>
                                                            {detail.isArchived && <> · 삭제일 {detail.post.deletedAt}</>}
                                                        </p>
                                                        <div className="nexus-community-post-content">{detail.post.content}</div>
                                                        {!detail.isArchived && (
                                                            <button type="button" className="boards-delete" onClick={() => deletePost(detail.post.id)}>
                                                                게시글 삭제
                                                            </button>
                                                        )}

                                                        <h3 className="nexus-community-comments-heading">댓글 {detail.comments.length}개</h3>
                                                        {detail.comments.length === 0 && <p>댓글이 없습니다.</p>}
                                                        {arrangeComments(detail.comments).map((c) => (
                                                            <div key={c.id} className={`nexus-community-comment${c.depth === 1 ? " is-reply nexus-reply-row" : ""}`}>
                                                                <div className="nexus-community-comment-content">
                                                                    <small>{c.depth === 1 && <span className="nexus-reply-mark">↳ 대댓글 · </span>}{c.authorName}{c.isAnonymous ? '(익명)' : ''} · {c.createdAt}</small>
                                                                    {c.isDeleted && <div><span className="nexus-deleted-badge">삭제된 댓글입니다.</span></div>}
                                                                    <div className={c.isDeleted ? "nexus-deleted-content" : ""}>{c.content}</div>
                                                                </div>
                                                                {!c.isDeleted && !detail.isArchived && (
                                                                    <button type="button" className="boards-delete" onClick={() => deleteComment(c.id)}>삭제</button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <NumberedPager currentPage={currentPage} totalPages={totalPages} total={total} pageSize={COMMUNITY_PAGE_SIZE} onPage={goTo} />
            </div>
        </div>
    );
}

export default Community;
