import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";

function CommunityBookmark(props) {
    const [bookmarked, setBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    // 빠르게 여러 번 클릭하는 경우 중복 요청 방지
    const savingRef = useRef(false);

    const postId = props.postId;
    const loginUser = getLoginUser();

    const employeeId =
        !loginUser.isDummy && loginUser.id != null
            ? loginUser.id
            : null;

    // 게시글을 열면 기존 북마크 상태 조회
    useEffect(function () {
        let cancelled = false;

        async function loadBookmark() {
            setErrorMessage("");

            // 로그인하지 않았다면 조회 요청을 보내지 않음
            if (employeeId === null) {
                setBookmarked(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const response = await axios.get(
                    API_BASE + "/api/community-bookmarks",
                    {
                        params: {
                            postId: postId,
                            employeeId: employeeId
                        }
                    }
                );

                if (!cancelled) {
                    setBookmarked(response.data.bookmarked);
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(
                        error.response?.data?.message ||
                        "북마크 정보를 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadBookmark();

        return function () {
            cancelled = true;
        };
    }, [postId, employeeId, reloadCount]);

    // 오류 발생 시 현재 DB 상태 다시 조회
    function reloadBookmark() {
        setIsLoading(true);

        setReloadCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    // 북마크 등록 또는 취소
    async function changeBookmark() {
        if (
            savingRef.current ||
            isLoading ||
            errorMessage !== ""
        ) {
            return;
        }

        if (employeeId === null) {
            alert("로그인한 뒤 북마크를 이용해주세요.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            let response;

            if (bookmarked) {
                // 저장된 상태라면 취소
                response = await axios.delete(
                    API_BASE + "/api/community-bookmarks",
                    {
                        data: {
                            postId: postId,
                            employeeId: employeeId
                        }
                    }
                );
            } else {
                // 저장되지 않은 상태라면 등록
                response = await axios.post(
                    API_BASE + "/api/community-bookmarks",
                    {
                        postId: postId,
                        employeeId: employeeId
                    }
                );
            }

            // 서버가 보내준 실제 처리 결과 반영
            setBookmarked(response.data.bookmarked);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "북마크 처리 결과를 확인하지 못했습니다."
            );
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="community-actions">
                <span role="status">
                    북마크 확인 중…
                </span>
            </div>
        );
    }

    if (errorMessage !== "") {
        return (
            <div className="community-actions">
                <p role="alert">{errorMessage}</p>

                <button
                    type="button"
                    className="community-button"
                    onClick={reloadBookmark}
                    disabled={isSaving}
                >
                    다시 조회
                </button>
            </div>
        );
    }

    let buttonText = "☆ 북마크";

    if (isSaving) {
        buttonText = "처리 중…";
    } else if (bookmarked) {
        buttonText = "★ 북마크됨";
    }

    return (
        <div className="community-actions">
            <button
                type="button"
                className={
                    bookmarked
                        ? "community-primary-button"
                        : "community-button"
                }
                aria-pressed={bookmarked}
                disabled={isSaving}
                onClick={changeBookmark}
            >
                {buttonText}
            </button>
        </div>
    );
}

export default CommunityBookmark;