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
        <section className="activity-summary cmd-activity-summary" aria-label={userName + "님의 커뮤니티 활동 요약"}>
            <dl className="cmd-activity-stats">
                <div className="tone-green">
                    <dt>작성한 글</dt>
                    <dd className="cmd-num">{props.myPosts.length}</dd>
                </div>

                <div className="tone-sky">
                    <dt>작성한 댓글 <span className="cmd-activity-note">답글 포함</span></dt>
                    <dd className="cmd-num" aria-live="polite">
                        {commentCount !== null && !loadError && !isLoading ? commentCount : commentText}
                    </dd>
                    {loadError && (
                        <button
                            type="button"
                            className="activity-retry cmd-text-btn"
                            onClick={retryLoad}
                        >
                            다시 불러오기
                        </button>
                    )}
                </div>

                <div className="tone-purple">
                    <dt>해결한 내 질문</dt>
                    <dd className="cmd-num">{resolvedPosts.length}</dd>
                </div>
            </dl>
        </section>
    );
}

export default ActivitySummary;