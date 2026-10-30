import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";

function CommunityComments(props) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [reloadCount, setReloadCount] = useState(0);

    const savingRef = useRef(false);
    const loginUser = getLoginUser();
    const postId = props.postId;

    const isLoggedIn =
        !loginUser.isDummy && loginUser.id != null;

    // ===================================
    // 댓글 불러오기
    // ===================================

    useEffect(function () {
        let cancelled = false;

        async function loadComments() {
            setIsLoading(true);
            setLoadError("");

            try {
                const response = await axios.get(
                    API_BASE + "/api/community-comments",
                    {
                        params: {
                            postId: postId
                        }
                    }
                );

                if (!cancelled) {
                    setComments(response.data);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError("댓글을 불러오지 못했습니다.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadComments();

        return function () {
            cancelled = true;
        };
    }, [postId, reloadCount]);

    function reloadComments() {
        setReloadCount(function (previousCount) {
            return previousCount + 1;
        });
    }

    function changeContent(event) {
        setContent(event.target.value);
    }

    // 서버에서 받은 오류 메시지 표시
    function showError(error, defaultMessage) {
        let message = defaultMessage;

        if (
            error.response &&
            error.response.data &&
            error.response.data.message
        ) {
            message = error.response.data.message;
        }

        alert(message);
    }

    // ===================================
    // 댓글 등록
    // ===================================

    async function saveComment(event) {
        event.preventDefault();

        if (savingRef.current) {
            return;
        }

        if (!isLoggedIn) {
            alert("로그인한 뒤 댓글을 작성해주세요.");
            return;
        }

        if (content.trim() === "") {
            alert("댓글을 입력해주세요.");
            return;
        }

        if (content.trim().length > 1000) {
            alert("댓글은 1000자까지 입력할 수 있습니다.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            await axios.post(
                API_BASE + "/api/community-comments",
                {
                    postId: postId,
                    authorId: loginUser.id,
                    content: content.trim()
                }
            );

            // 저장 성공 후 입력창 비우기
            setContent("");

            // DB에서 댓글 목록 다시 불러오기
            reloadComments();
        } catch (error) {
            showError(error, "댓글 등록에 실패했습니다.");
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    // ===================================
    // 댓글 삭제
    // ===================================

    async function deleteComment(comment) {
        if (savingRef.current) {
            return;
        }

        if (
            !isLoggedIn ||
            String(comment.authorId) !== String(loginUser.id)
        ) {
            alert("본인이 작성한 댓글만 삭제할 수 있습니다.");
            return;
        }

        const answer = window.confirm("댓글을 삭제할까요?");

        if (answer === false) {
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            await axios.delete(
                API_BASE + "/api/community-comments/" + comment.id,
                {
                    data: {
                        authorId: loginUser.id
                    }
                }
            );

            setComments(function (previousComments) {
                return previousComments.filter(function (item) {
                    return String(item.id) !== String(comment.id);
                });
            });
        } catch (error) {
            showError(error, "댓글 삭제에 실패했습니다.");
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        return new Date(value).toLocaleString("ko-KR");
    }

    // ===================================
    // 댓글 목록 화면
    // ===================================

    let commentList;

    if (isLoading) {
        commentList = (
            <p className="community-comment-message" role="status">
                댓글을 불러오는 중입니다.
            </p>
        );
    } else if (loadError !== "") {
        commentList = (
            <div className="community-comment-message">
                <p role="alert">{loadError}</p>

                <button
                    type="button"
                    className="community-button"
                    onClick={reloadComments}
                >
                    다시 시도
                </button>
            </div>
        );
    } else if (comments.length === 0) {
        commentList = (
            <p className="community-comment-message">
                첫 번째 댓글을 남겨보세요.
            </p>
        );
    } else {
        commentList = (
            <ul className="community-comment-list">
                {comments.map(function (comment) {
                    let deleteButton = null;

                    if (
                        isLoggedIn &&
                        String(comment.authorId) === String(loginUser.id)
                    ) {
                        deleteButton = (
                            <button
                                type="button"
                                className="community-comment-delete"
                                disabled={isSaving}
                                onClick={function () {
                                    deleteComment(comment);
                                }}
                            >
                                삭제
                            </button>
                        );
                    }

                    return (
                        <li
                            key={comment.id}
                            className="community-comment-item"
                        >
                            <div className="community-comment-header">
                                <strong>{comment.authorName}</strong>
                                {deleteButton}
                            </div>

                            <p className="community-comment-content">
                                {comment.content}
                            </p>

                            <span className="community-comment-date">
                                {formatDate(comment.createdAt)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    let countLabel = "";

    if (!isLoading && loadError === "") {
        countLabel = " " + comments.length;
    }

    let placeholder = "동료에게 댓글을 남겨보세요.";

    if (!isLoggedIn) {
        placeholder = "로그인 후 댓글을 작성할 수 있습니다.";
    }

    return (
        <section className="community-comments">
            <h3 className="community-comments-title">
                댓글{countLabel}
            </h3>

            {commentList}

            <form
                className="community-comment-form"
                onSubmit={saveComment}
            >
                <label htmlFor={"comment-content-" + postId}>
                    댓글 작성
                </label>

                <textarea
                    id={"comment-content-" + postId}
                    value={content}
                    onChange={changeContent}
                    placeholder={placeholder}
                    maxLength={1000}
                    disabled={!isLoggedIn || isSaving}
                    rows={3}
                />

                <div className="community-comment-form-bottom">
                    <span>{content.length} / 1000</span>

                    <button
                        type="submit"
                        className="community-primary-button"
                        disabled={!isLoggedIn || isSaving}
                    >
                        댓글 등록
                    </button>
                </div>
            </form>
        </section>
    );
}

export default CommunityComments;