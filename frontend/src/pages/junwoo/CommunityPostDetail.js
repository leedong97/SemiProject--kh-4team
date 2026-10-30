import React from "react";
import CommunityComments from "./CommunityComments";
import CommunityLike from "./CommunityLike";

function CommunityPostDetail(props) {
    const post = props.post;

    let questionStatus = null;

    if (post.boardName === "질문 답변") {
        let statusText = "답변 대기";
        let statusClass = "question-status question-status-waiting";

        if (Number(post.isResolved) === 1) {
            statusText = "해결 완료";
            statusClass = "question-status question-status-resolved";
        }

        questionStatus = (
            <span className={statusClass}>
                {statusText}
            </span>
        );
    }

    let createdDate = "-";

    if (post.createdAt) {
        createdDate = new Date(post.createdAt).toLocaleString("ko-KR");
    }

    return (
        <div className="community-home">
            <h1 className="community-title">
                게시글 상세보기
            </h1>

            <div className="community-panel">
                <p className="community-detail-board">
                    {post.boardName}
                </p>

                <h2 className="community-panel-title">
                    {post.title}
                </h2>

                {questionStatus}

                <p className="community-detail-date">
                    작성일 : {createdDate}
                </p>

                {/* 게시글 본문 */}
                <p className="community-post-content">
                    {post.content}
                </p>

                {/* 좋아요 */}
                <CommunityLike
                    key={post.id}
                    postId={post.id}
                />

                {/* 댓글 */}
                <CommunityComments
                    key={post.id}
                    postId={post.id}
                />

                <div className="community-actions">
                    <button
                        type="button"
                        className="community-button"
                        onClick={props.onBack}
                    >
                        목록으로
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CommunityPostDetail;