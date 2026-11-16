import Pagination from "../../shared/Pagination";
import { Priority } from "../../shared/priority";

import React, { useEffect, useState } from "react";
import { erpRequest } from "../heeseung/erpApi";
import { Link, useParams, useNavigate } from "react-router-dom";

function Issue_detail({ projects = [], issues = [] }) {

    // 🔴 URL의 :id 값을 가져온다.
    const { id } = useParams();

    // 🔴 페이지 이동 Hook
    const navigate = useNavigate();

    // 🔴 URL의 ID와 일치하는 이슈를 찾는다.
    // useParams에서 받은 id는 문자열이므로 String으로 비교
    const issue = issues.find(
        (item) => String(item.id) === id
    );
    const [pages, setPages] = useState(1);
    const [comments, setComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(true);
    const [commentError, setCommentError] = useState("");

    useEffect(() => {
        let cancelled = false;

        setPages(1);
        setComments([]);
        setCommentLoading(true);
        setCommentError("");

        erpRequest(`/api/dong/issues/${id}/comments`)
            .then((rows) => {
                if (!cancelled) setComments(rows);
            })
            .catch((error) => {
                if (!cancelled) setCommentError(error.message);
            })
            .finally(() => {
                if (!cancelled) setCommentLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);
    // 해당 이슈가 존재하지 않는 경우
    if (!issue) {
        return (
            <main className="todo-page todo-detail-page project-style-detail">
                <h2>이슈를 찾을 수 없습니다.</h2>
                <button onClick={() => navigate("/issue")}>
                    목록으로 돌아가기
                </button>
            </main>
        );
    }

    // 🔴 해당 이슈가 속한 프로젝트 조회
    const project = projects.find(
        (p) => String(p.id) === String(issue.projectId)
    );

    const related = issues.filter(other => String(other.id) !== id && String(other.projectId) === String(issue.projectId));
    const activePage = Math.min(pages, Math.max(1, Math.ceil(related.length / 10)));

    return (
        <main className="todo-page todo-detail-page project-style-detail">

            <div className="todo-detail-header">
                <div>
                    <h1>이슈 상세정보</h1>

                </div>

                <button onClick={() => navigate("/issue")}>
                    목록으로
                </button>
            </div>

            <div className="todo-detail-content">

                {/* 이슈 ID */}
                <div className="todo-detail-row">
                    <strong>이슈 ID</strong>
                    <span>
                        {`ISS-${String(issue.id).padStart(3, "0")}`}
                    </span>
                </div>

                {/* 해당 프로젝트 타이틀 */}
                <div className="todo-detail-row">
                    <strong>프로젝트명</strong>
                    <span>{issue.projectName || project?.name || "프로젝트 정보 없음"}</span>
                </div>

                {/* 이슈 제목 */}
                <div className="todo-detail-row">
                    <strong>이슈 제목</strong>
                    <span>{issue.title}</span>
                </div>

                {/* 담당자 */}
                <div className="todo-detail-row">
                    <strong>담당자(직급)</strong>
                    <span>
                        {issue.assigneeName || "미배정"}
                        {issue.assigneeGrade ? ` (${issue.assigneeGrade})` : ""}
                    </span>
                </div>

                {/* 담당자 연락처 */}
                <div className="todo-detail-row">
                    <strong>담당자 연락처</strong>
                    <span>{issue.assigneePhone || "-"}</span>
                </div>
                {/* 등록일 */}
                <div className="todo-detail-row">
                    <strong>등록일</strong>
                    <span>{issue.createdAt ? String(issue.createdAt).replace("T", " ").slice(0, 16) : "-"}</span>
                </div>

                {/* 상태 */}
                <div className="todo-detail-row">
                    <strong>처리 상태</strong>
                    <span className="issue-status">
                        {issue.status}
                    </span>
                </div>

                <div className="todo-detail-row"><strong>우선순위</strong><span><Priority value={issue.priority} /></span></div>
                {/* 이슈 내용 */}
                <div className="todo-detail-description">
                    <h3>이슈 내용</h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>{issue.description}</p>
                </div>

                <section className="todo-detail-description">
                    <h3>요청사항 코멘트</h3>

                    {commentLoading && <p>코멘트를 불러오는 중...</p>}
                    {commentError && <p role="alert">{commentError}</p>}

                    {!commentLoading && !commentError && comments.length === 0 && (
                        <p>등록된 요청사항 코멘트가 없습니다.</p>
                    )}

                    {!commentLoading && !commentError && comments.map((comment) => (
                        <article key={comment.id}>
                            <strong>{comment.author || "관리자"}</strong>
                            <small> · {comment.createdAt}</small>
                            <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                {comment.content}
                            </p>
                        </article>
                    ))}
                </section>

            </div>

            <div className="detail-other todo-detail-other">
                <h3>같은 프로젝트의 다른 이슈</h3>
                <div className="todo-list-head detail-columns"><div className="todo-head-title"><span>번호</span><span>제목</span></div><span>담당자</span></div>
                <ol className="todo-list">
                    {related.slice((activePage - 1) * 10, activePage * 10).map(other => <li key={other.id} className="todo-item detail-columns">
                        <div className="todo-title"><span className="todo-number">{other.id}</span><Link to={`/issue/${other.id}`}>{other.title}</Link></div>
                        <span className="todo-author">{other.assigneeName || "미배정"}</span>
                    </li>)}
                </ol>
                {related.length === 0 && <p className="todo-empty">다른 이슈가 없습니다.</p>}
                <Pagination total={related.length} currentPage={activePage} onPage={setPages} label="같은 프로젝트 이슈 페이지" />
            </div>
            <div className="todo-detail-bottom">
                {issue.status !== "완료" && <button onClick={() => navigate(`/issue/completion-request?issueId=${issue.id}`)}>
                    이슈 완료 요청
                </button>}
                <button onClick={() => navigate("/issue")}>
                    이슈 목록으로 돌아가기
                </button>
            </div>

        </main>
    );
}

export default Issue_detail;
