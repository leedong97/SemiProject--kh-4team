import React, { useEffect, useState } from "react";
import { adminRequest } from "../adminApi";

// 커뮤니티 관리: 게시글과 댓글을 보고 삭제합니다.
function Community() {
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState(null); // { post, comments }

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

    async function openPost(id) {
        try {
            const data = await adminRequest(`/community/posts/${id}`);
            setDetail(data);
        } catch (err) {
            alert(err.message);
        }
    }

    async function deletePost(id) {
        if (!window.confirm("이 게시글을 삭제할까요? 댓글도 함께 사라지며 되돌릴 수 없습니다.")) return;
        try {
            await adminRequest(`/community/posts/${id}`, { method: "DELETE" });
            setDetail(null);
            await loadPosts();
        } catch (err) {
            alert(err.message);
        }
    }

    async function deleteComment(commentId) {
        if (!window.confirm("이 댓글을 삭제할까요?")) return;
        try {
            await adminRequest(`/community/comments/${commentId}`, { method: "DELETE" });
            await openPost(detail.post.id);
            await loadPosts();
        } catch (err) {
            alert(err.message);
        }
    }

    useEffect(() => { loadPosts(); }, []);

    const keyword = search.trim().toLowerCase();
    const filtered = posts.filter((p) =>
        !keyword || String(p.title || "").toLowerCase().includes(keyword)
    );

    return (
        <div className="admin-boards">
            <div className="boards-header">
                <div>
                    <span className="boards-label">WORKSPACE / COMMUNITY</span>
                    <h1>커뮤니티 관리</h1>
                    <p>게시글과 댓글을 확인하고 삭제합니다.</p>
                </div>
                <div className="boards-count">전체 게시글<strong>{posts.length}건</strong></div>
            </div>

            <div className="boards-list">
                <div className="boards-list-header">
                    <h2>게시글 목록</h2>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="제목 검색" />
                </div>

                {loading && <p>불러오는 중...</p>}
                {error && <p role="alert">서버 오류: {error}</p>}

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
                            ) : filtered.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.boardName}</td>
                                    <td className="boards-title-cell">{p.title}</td>
                                    <td>{p.authorName}</td>
                                    <td>{p.createdAt}</td>
                                    <td>{p.commentCount}</td>
                                    <td><div className="boards-actions">
                                        <button type="button" onClick={() => openPost(p.id)}>보기</button>
                                        <button type="button" className="boards-delete" onClick={() => deletePost(p.id)}>삭제</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {detail && (
                <div className="boards-list" style={{ marginTop: "16px" }}>
                    <div className="boards-list-header">
                        <h2>{detail.post.title}</h2>
                        <button type="button" onClick={() => setDetail(null)}>닫기</button>
                    </div>
                    <p>{detail.post.boardName} · {detail.post.authorName} · {detail.post.createdAt}</p>
                    <div style={{ whiteSpace: "pre-wrap", margin: "12px 0" }}>{detail.post.content}</div>
                    <button type="button" className="boards-delete" onClick={() => deletePost(detail.post.id)}>
                        게시글 삭제
                    </button>

                    <h3 style={{ marginTop: "20px" }}>댓글 {detail.comments.length}개</h3>
                    {detail.comments.length === 0 && <p>댓글이 없습니다.</p>}
                    {detail.comments.map((c) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid #edf1f5" }}>
                            <div>
                                <small>{c.authorName} · {c.createdAt}</small>
                                <div>{c.isDeleted ? "삭제된 댓글입니다." : c.content}</div>
                            </div>
                            {!c.isDeleted && (
                                <button type="button" className="boards-delete" onClick={() => deleteComment(c.id)}>삭제</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Community;
