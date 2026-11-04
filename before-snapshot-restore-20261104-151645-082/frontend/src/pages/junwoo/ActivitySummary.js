import React, { useEffect, useState } from "react";
import axios from "../dong/communityClient";
import { API_BASE } from "../../shared/config";

function ActivitySummary(props) {
    const [commentCount, setCommentCount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const userId = props.loginUser.id;
    const isDummy = props.loginUser.isDummy;

    // 작성한 질문 중 해결 완료된 질문 수
    const resolvedPosts = props.myPosts.filter(function (post) {
        return (
            post.boardName === "질문 답변" &&
            Number(post.isResolved) === 1
        );
    });

    // 로그인한 사람의 댓글 수 조회
    useEffect(function () {
        let cancelled = false;

        if (isDummy || userId == null) {
            return;
        }

        async function loadCommentCount() {
            setIsLoading(true);
            setLoadError(false);
            setCommentCount(null);

            try {
                const response = await axios.get(
                    API_BASE + "/api/community-comments/mine",
                    {
                        params: {
                            authorId: userId
                        }
                    }
                );

                if (!cancelled) {
                    setCommentCount(response.data.length);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError(true);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadCommentCount();

        return function () {
            cancelled = true;
        };
    }, [userId, isDummy, retryCount]);

    function retryLoad() {
        setRetryCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    // 로그인 전에는 프로필과 숫자를 표시하지 않음
    if (isDummy || userId == null) {
        return null;
    }

    let userName = "직원";

    if (props.loginUser.name) {
        userName = props.loginUser.name;
    }

    let commentText = "불러오는 중";

    if (loadError) {
        commentText = "조회 실패";
    } else if (!isLoading && commentCount !== null) {
        commentText = commentCount + "개";
    }

    return (
        <section className="activity-summary" aria-label="내 활동 요약">
            <div className="activity-profile">
                <div className="activity-avatar" aria-hidden="true">
                    {userName.slice(0, 1)}
                </div>

                <div className="activity-profile-text">
                    <span className="activity-profile-label">
                        MY COMMUNITY
                    </span>

                    <h2>{userName}님의 커뮤니티 활동</h2>

                    <p>나눈 이야기와 함께한 대화를 모았어요.</p>
                </div>

                <span className="activity-profile-decoration" aria-hidden="true">
                    ✦
                </span>
            </div>

            <div className="activity-stats">
                <div className="activity-stat activity-stat-post">
                    <span className="activity-stat-icon" aria-hidden="true">
                        ✍️
                    </span>

                    <div>
                        <p>작성한 글</p>
                        <strong>{props.myPosts.length}개</strong>
                        <span className="activity-stat-description">
                            내가 나눈 이야기
                        </span>
                    </div>
                </div>

                <div className="activity-stat activity-stat-comment">
                    <span className="activity-stat-icon" aria-hidden="true">
                        💬
                    </span>

                    <div>
                        <p>작성한 댓글</p>

                        <strong aria-live="polite">
                            {commentText}
                        </strong>

                        <span className="activity-stat-description">
                            댓글과 답글을 포함해요
                        </span>

                        {loadError && (
                            <button
                                type="button"
                                className="activity-retry"
                                onClick={retryLoad}
                            >
                                다시 불러오기
                            </button>
                        )}
                    </div>
                </div>

                <div className="activity-stat activity-stat-resolved">
                    <span className="activity-stat-icon" aria-hidden="true">
                        ✅
                    </span>

                    <div>
                        <p>해결한 내 질문</p>
                        <strong>{resolvedPosts.length}개</strong>
                        <span className="activity-stat-description">
                            해결 완료로 표시한 질문
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ActivitySummary;