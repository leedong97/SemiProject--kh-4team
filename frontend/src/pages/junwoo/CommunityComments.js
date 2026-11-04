import React, { useEffect, useRef, useState } from "react";
import axios, { encodeAttachments } from "../dong/communityClient";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";
import FileAttachment from '../dong/components/FileAttachment';
import AnonymousToggle from '../dong/components/AnonymousToggle';
import StoredAttachments from '../dong/components/StoredAttachments';

function CommunityComments(props) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [reloadCount, setReloadCount] = useState(0);

    // 댓글 작성
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [files, setFiles] = useState([]);

    // 댓글 수정
    const [editAnonymous, setEditAnonymous] = useState(false);
    const [editFiles, setEditFiles] = useState([]);
    const [removeAttachmentIds, setRemoveAttachmentIds] = useState([]);

    // 답글 작성
    const [replyAnonymous, setReplyAnonymous] = useState(false);
    const [replyFiles, setReplyFiles] = useState([]);

    // 수정 중인 댓글 번호
    const [editingId, setEditingId] = useState(null);

    // 수정 입력창의 내용
    const [editContent, setEditContent] = useState("");

    // 현재 답글 입력창을 연 댓글 번호
    const [replyParentId, setReplyParentId] = useState(null);

    // 답글 내용
    const [replyContent, setReplyContent] = useState("");

    const savingRef = useRef(false);
    const loginUser = getLoginUser();
    const postId = props.postId;
    const onCountChange = props.onCountChange;

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
                    const loadedComments = response.data;

                    setComments(loadedComments);

                    // 삭제되지 않은 댓글·답글 개수
                    const count = loadedComments.filter(function (comment) {
                        return Number(comment.isDeleted) === 0;
                    }).length;

                    // 게시판 목록에도 개수 전달
                    if (onCountChange) {
                        onCountChange(postId, count);
                    }
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
    }, [postId, reloadCount, onCountChange]);

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
                    content: content.trim(),
                    isAnonymous,
                    files: await encodeAttachments(files)
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
    // 답글 입력창 열기 · 닫기
    // ===================================

    function openReply(commentId) {
        if (savingRef.current) {
            return;
        }

        if (!isLoggedIn) {
            alert("로그인한 뒤 답글을 작성해주세요.")
            return;
        }

        setReplyParentId(commentId);
        setReplyContent("");
        setEditingId(null);
        setEditContent("");

    }

    function closeReply() {
        if (savingRef.current) {
            return;
        }

        setReplyParentId(null);
        setReplyContent("");
    }

    // ===================================
    // 답글 등록
    // ===================================

    async function saveReComment(event) {
        event.preventDefault();

        if (savingRef.current) {
            return;
        }

        if (!isLoggedIn) {
            alert("로그인한 뒤 답글을 작성해주세요.")
            return;
        }

        if (replyParentId === null) {
            alert("답글을 작성할 댓글을 선택해주세요.")
            return;
        }

        const trimmedContent = replyContent.trim();

        if (trimmedContent === "") {
            alert("답글을 입력해주세요.")
            return;
        }

        if (trimmedContent.length > 1000) {
            alert("답글은 1000자까지 입력할 수 있습니다.")
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
                    content: trimmedContent,
                    parentId: replyParentId,
                    isAnonymous: replyAnonymous,
                    files: await encodeAttachments(replyFiles)
                }
            );

            setReplyContent("");
            setReplyParentId(null);
            reloadComments();

        } catch (error) {

            showError(error, "답글 등록에 실패했습니다.")

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

            reloadComments();

        } catch (error) {
            showError(error, "댓글 삭제에 실패했습니다.");
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    // ===================================
    // 댓글 · 답글 수정창 열기
    // ===================================

    function openEdit(comment) {
        if (savingRef.current) {
            return;
        }

        if (
            !isLoggedIn ||
            String(comment.authorId) !== String(loginUser.id)
        ) {
            alert("본인이 작성한 댓글만 수정할 수 있습니다.");
            return;
        }

        if (Number(comment.isDeleted) === 1) {
            alert("삭제된 댓글은 수정할 수 없습니다.");
            return;
        }

        // 수정할 댓글 번호와 기존 내용을 저장
        setEditingId(comment.id);
        setEditContent(comment.content);
        setEditAnonymous(
            comment.isAnonymous === true || comment.isAnonymous === 1
        );
        setEditFiles([]);
        setRemoveAttachmentIds([]);

        // 열려 있던 답글 입력창 닫기
        setReplyParentId(null);
        setReplyContent("");
    }

    // ===================================
    // 수정 취소
    // ===================================

    function cancelEdit() {
        if (savingRef.current) {
            return;
        }

        setEditingId(null);
        setEditContent("");
    }

    // ===================================
    // 수정 내용 저장
    // ===================================

    async function saveEdit(event) {
        event.preventDefault();

        if (savingRef.current) {
            return;
        }

        if (!isLoggedIn) {
            alert("로그인 후 수정해주세요.");
            return;
        }

        if (editingId === null) {
            return;
        }

        const trimmedContent = editContent.trim();

        if (trimmedContent === "") {
            alert("수정할 내용을 입력해주세요.");
            return;
        }

        if (trimmedContent.length > 1000) {
            alert("댓글은 1000자까지 입력할 수 있습니다.");
            return;
        }

        savingRef.current = true;
        setIsSaving(true);

        try {
            await axios.put(
                API_BASE + "/api/community-comments/" + editingId,
                {
                    authorId: loginUser.id,
                    content: trimmedContent,
                    isAnonymous: editAnonymous,
                    files: await encodeAttachments(editFiles),
                    removeAttachmentIds
                }
            );

            // 저장 성공 후 수정창 닫기
            setEditingId(null);
            setEditContent("");

            // 수정된 목록 다시 조회
            reloadComments();
        } catch (error) {
            showError(error, "댓글 수정에 실패했습니다.");
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
    // 댓글 한 개의 내용 표시
    // ===================================

    function renderCommentBody(comment, isReply) {
        const isDeleted = Number(comment.isDeleted) === 1;

        const isEditing =
            !isDeleted &&
            editingId !== null &&
            String(editingId) === String(comment.id);

        const canDelete =
            !isDeleted &&
            isLoggedIn &&
            String(comment.authorId) === String(loginUser.id);

        const isReplyOpen =
            !isReply &&
            replyParentId !== null &&
            String(replyParentId) === String(comment.id);

        return (
            <>

                <div className="community-comment-header">
                    <strong>
                        {isDeleted ? "삭제된 댓글" : comment.authorName}
                    </strong>

                    {canDelete && (
                        <div className="community-comment-owner-actions">
                            <button
                                type="button"
                                className="community-reply-button"
                                disabled={isSaving || isEditing}
                                onClick={function () {
                                    openEdit(comment);
                                }}
                            >
                                수정
                            </button>

                            <button
                                type="button"
                                className="community-comment-delete"
                                disabled={isSaving || isEditing}
                                onClick={function () {
                                    deleteComment(comment);
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    )}

                </div>

                {isEditing ? (
                    <form
                        className="community-comment-form"
                        onSubmit={saveEdit}
                    >
                        <label htmlFor={"edit-comment-" + comment.id}>
                            내용 수정
                        </label>

                        <textarea
                            id={"edit-comment-" + comment.id}
                            value={editContent}
                            onChange={function (event) {
                                setEditContent(event.target.value);
                            }}
                            maxLength={1000}
                            rows={3}
                            disabled={isSaving}
                        />

                        <div className="community-comment-form-bottom">
                            <span>{editContent.length} / 1000</span>
                            <AnonymousToggle checked={editAnonymous} onChange={setEditAnonymous} anonymousNumber={comment.anonymousNumber} disabled={isSaving} />
                            <StoredAttachments files={(comment.attachments || []).filter(f => !removeAttachmentIds.includes(f.id))} onRemove={id => setRemoveAttachmentIds(old => [...old, id])} disabled={isSaving} />
                            <FileAttachment files={editFiles} onChange={setEditFiles} disabled={isSaving} />

                            <div className="community-reply-form-buttons">
                                <button
                                    type="button"
                                    className="community-button"
                                    onClick={cancelEdit}
                                    disabled={isSaving}
                                >
                                    취소
                                </button>

                                <button
                                    type="submit"
                                    className="community-primary-button"
                                    disabled={
                                        isSaving ||
                                        editContent.trim() === ""
                                    }
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <p className="community-comment-content">
                        {isDeleted
                            ? "삭제된 댓글입니다."
                            : comment.content}
                    </p>
                )}

                {/* 저장된 첨부파일 표시 */}
                {!isEditing && !isDeleted && (
                    <StoredAttachments files={comment.attachments || []} />
                )}

                <div className="community-comment-actions">
                    <span className="community-comment-date">
                        {formatDate(comment.createdAt)}
                    </span>

                    {!isReply && isLoggedIn && (
                        <button type="button"
                            className="community-reply-button"
                            disabled={isSaving}
                            onClick={function () {
                                if (isReplyOpen) {
                                    closeReply();
                                } else {
                                    openReply(comment.id);
                                }
                            }}
                        >
                            {isReplyOpen ? "답글 닫기" : "답글"}
                        </button>
                    )}

                </div>

                {isReplyOpen && (
                    <form className="community-comment-form community-reply-form"
                        onSubmit={saveReComment}
                    >
                        <label htmlFor={"reply-content-" + comment.id}>
                            답글 작성
                        </label>

                        <textarea id={"reply-content-" + comment.id}
                            value={replyContent}
                            onChange={function (event) {
                                setReplyContent(event.target.value);
                            }}
                            placeholder="답글을 입력해주세요."
                            maxLength={1000}
                            disabled={isSaving}
                            rows={3}
                        />

                        <div className="community-comment-form-bottom">
                            <span>{replyContent.length} / 1000</span>
                            <AnonymousToggle checked={replyAnonymous} onChange={setReplyAnonymous} disabled={isSaving} />
                            <FileAttachment files={replyFiles} onChange={setReplyFiles} disabled={isSaving} />

                            <div className="community-reply-form-buttons">
                                <button type="button"
                                    className="community-button"
                                    disabled={isSaving}
                                    onClick={closeReply}
                                >
                                    취소
                                </button>

                                <button type="submit"
                                    className="community-primary-button"
                                    disabled={
                                        isSaving ||
                                        replyContent.trim() === ""
                                    }
                                >
                                    답글 등록
                                </button>

                            </div>

                        </div>

                    </form>
                )}

            </>
        );

    }

    // ===================================
    // 삭제되지 않은 답글만 묶기
    // ===================================

    const repliesByParent = new Map();

    comments.forEach(function (comment) {
        // 일반 댓글은 제외
        if (comment.parentId == null) {
            return;
        }

        // 삭제된 답글은 화면에 표시하지 않음
        if (Number(comment.isDeleted) === 1) {
            return;
        }

        const parentKey = String(comment.parentId);

        if (!repliesByParent.has(parentKey)) {
            repliesByParent.set(parentKey, []);
        }

        repliesByParent.get(parentKey).push(comment);

    });

    // ===================================
    // 화면에 표시할 원래 댓글 고르기
    // ===================================

    const rootComments = comments.filter(function (comment) {
        // 답글은 제외
        if (comment.parentId != null) {
            return false;
        }

        // 삭제되지 않은 원래 댓글은 표시
        if (Number(comment.isDeleted) !== 1) {
            return true;
        }

        const replies =
            repliesByParent.get(String(comment.id)) || [];

        return replies.length > 0;
    })

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
    } else if (rootComments.length === 0) {
        commentList = (
            <p className="community-comment-message">
                첫 번째 댓글을 남겨보세요.
            </p>
        );
    } else {
        commentList = (
            <ul className="community-comment-list">
                {rootComments.map(function (comment) {
                    const replies =
                        repliesByParent.get(String(comment.id)) || [];

                    return (
                        <li
                            key={comment.id}
                            className="community-comment-item"
                        >
                            {renderCommentBody(comment, false)}

                            {replies.length > 0 && (
                                <ul className="community-reply-list">
                                    {replies.map(function (reply) {
                                        return (
                                            <li
                                                key={reply.id}
                                                className="community-comment-item community-reply-item"
                                            >
                                                {renderCommentBody(reply, true)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }

    let countLabel = "";

    if (!isLoading && loadError === "") {
        const activeCommentCount = comments.filter(function (comment) {
            return Number(comment.isDeleted) !== 1;
        }).length;

        countLabel = " " + activeCommentCount;
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
                    <AnonymousToggle checked={isAnonymous} onChange={setIsAnonymous} disabled={!isLoggedIn || isSaving} />
                    <FileAttachment files={files} onChange={setFiles} disabled={!isLoggedIn || isSaving} />

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