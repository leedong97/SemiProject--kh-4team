
import React from "react";
import { useParams, useNavigate } from "react-router-dom";

function Issue_detail({ projects, issues }) {

    // 🔴 URL의 :id 값을 가져온다.
    const { id } = useParams();

    // 🔴 페이지 이동 Hook
    const navigate = useNavigate();

    // 🔴 URL의 ID와 일치하는 이슈를 찾는다.
    // useParams에서 받은 id는 문자열이므로 String으로 비교
    const issue = issues.find(
        (item) => String(item.id) === id
    );

    // 해당 이슈가 존재하지 않는 경우
    if (!issue) {
        return (
            <main className="issue-detail-page">
                <h2>이슈를 찾을 수 없습니다.</h2>
                <button onClick={() => navigate("/issue")}>
                    목록으로 돌아가기
                </button>
            </main>
        );
    }

    // 🔴 해당 이슈가 속한 프로젝트 조회
    const project = projects.find(
        (p) => p.id === issue.projectId
    );

    return (
        <main className="issue-detail-page">

            <div className="issue-detail-header">
                <div>
                    <h1>이슈 상세정보</h1>

                </div>

                <button onClick={() => navigate("/issue")}>
                    목록으로
                </button>
            </div>

            <div className="issue-detail-content">

                {/* 이슈 ID */}
                <div className="issue-detail-row">
                    <strong>이슈 ID</strong>
                    <span>
                        {`ISS-${String(issue.id).padStart(3, "0")}`}
                    </span>
                </div>

                {/* 해당 프로젝트 타이틀 */}
                <div className="issue-detail-row">
                    <strong>프로젝트명</strong>
                    <span>{issue.projectName || "프로젝트 정보 없음"}</span>
                </div>

                {/* 이슈 제목 */}
                <div className="issue-detail-row">
                    <strong>이슈 제목</strong>
                    <span>{issue.title}</span>
                </div>

                {/* 이슈 건의자 */}
                <div className="issue-detail-row">
                    <strong>이슈 건의자(직급)</strong>
                    <span>
                        {issue.reporterName || "-"}
                        {issue.reporterGrade
                            ? ` (${issue.reporterGrade})`
                            : ""}
                    </span>
                </div>

                {/* 건의자 연락처 */}
                <div className="issue-detail-row">
                    <strong>담당자 연락처</strong>
                    <span>{issue.reporterPhone || "-"}</span>
                </div>

                {/* 등록일 */}
                <div className="issue-detail-row">
                    <strong>등록일</strong>
                    <span>{issue.createdAt}</span>
                </div>

                {/* 상태 */}
                <div className="issue-detail-row">
                    <strong>처리 상태</strong>
                    <span className="issue-status">
                        {issue.status}
                    </span>
                </div>

                {/* 이슈 내용 */}
                <div className="issue-detail-description">
                    <h3>이슈 내용</h3>
                    <p>{issue.description}</p>
                </div>

            </div>

            <div className="issue-detail-bottom">
                <button onClick={() => navigate("/issue")}>
                    이슈 목록으로 돌아가기
                </button>
            </div>

        </main>
    );
}

export default Issue_detail;
