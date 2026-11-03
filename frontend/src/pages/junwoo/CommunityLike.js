import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";

function CommunityLike(props) {
    const [likeCount, setLikeCount] = useState(0);
    const [liked, setLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    const savingRef = useRef(false);
    const postId = props.postId;
    const loginUser = getLoginUser();

    let employeeId = null;

    if (!loginUser.isDummy && loginUser.id != null) {
        employeeId = loginUser.id;
    }

    // ===================================
    // 좋아요 정보 조회
    // ===================================

    useEffect(function () {
        let cancelled = false;

        async function loadLike() {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const params = {
                    postId: postId
                };

                if (employeeId !== null) {
                    params.employeeId = employeeId;
                }

                const response = await axios.get(
                    API_BASE + "/api/community-likes",
                    {
                        params: params
                    }
                );

                if (!cancelled) {
                    setLikeCount(response.data.likeCount);
                    setLiked(response.data.liked);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        "좋아요 정보를 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadLike();

        return function () {
            cancelled = true;
        };
    }, [postId, employeeId, reloadCount]);

    function reloadLike() {
        setIsLoading(true);

        setReloadCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    // ===================================
    // 좋아요 등록 또는 취소
    // ===================================

    async function changeLike() {
        if (
            savingRef.current ||
            isLoading ||
            errorMessage !== ""
        ) {
            return;
        }

        if (employeeId === null) {
            alert("로그인한 뒤 좋아요를 눌러주세요.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            if (liked) {
                // 이미 눌렀으면 취소
                await axios.delete(
                    API_BASE + "/api/community-likes",
                    {
                        data: {
                            postId: postId,
                            employeeId: employeeId
                        }
                    }
                );
            } else {
                // 아직 누르지 않았으면 등록
                await axios.post(
                    API_BASE + "/api/community-likes",
                    {
                        postId: postId,
                        employeeId: employeeId
                    }
                );
            }

            // 변경 후 DB의 개수와 상태 다시 확인
            reloadLike();
        } catch (error) {
            let message = "좋아요 처리 결과를 확인하지 못했습니다.";

            if (
                error.response &&
                error.response.data &&
                error.response.data.message
            ) {
                message = error.response.data.message;
            }

            // 결과가 불확실하면 다시 조회한 뒤 누르도록 안내
            setErrorMessage(message);
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    // ===================================
    // 버튼 표시
    // ===================================

    let buttonClass = "community-like-button";
    let heart = "♡";

    if (liked) {
        buttonClass += " community-like-selected";
        heart = "♥";
    }

    if (isLoading) {
        return (
            <div className="community-like-area">
                <span className="community-like-message" role="status">
                    좋아요 확인 중…
                </span>
            </div>
        );
    }

    if (errorMessage !== "") {
        return (
            <div className="community-like-area">
                <p className="community-like-message" role="alert">
                    {errorMessage}
                </p>

                <button
                    type="button"
                    className="community-button"
                    onClick={reloadLike}
                    disabled={isSaving}
                >
                    다시 조회
                </button>
            </div>
        );
    }

    return (
        <div className="community-like-area">
            <button
                type="button"
                className={buttonClass}
                aria-pressed={liked}
                disabled={isSaving}
                onClick={changeLike}
            >
                <span className="community-like-heart" aria-hidden="true">
                    {heart}
                </span>

                <span>좋아요</span>

                <strong>{likeCount}</strong>
            </button>
        </div>
    );
}

export default CommunityLike;