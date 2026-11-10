const express = require("express");
const db = require("../../db");
const { createNotification } = require("../../notify");

const {
    session,
    requireUser
} = require("../dong/communitySession");

const {
    comments: existingComments,
    decodeFiles,
    numberFor
} = require("../dong/communityService");

const router = express.Router();

// 사용자에게 전달할 오류
function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

// 게시글·댓글 번호 검사
function positiveId(value, label) {
    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 1) {
        fail(400, `${label}를 확인해주세요.`);
    }

    return number;
}

// 댓글 내용 검사
function commentText(value) {
    if (
        typeof value !== "string" ||
        value.trim() === "" ||
        value.trim().length > 1000
    ) {
        fail(400, "댓글과 답글은 1~1000자로 입력해주세요.");
    }

    return value.trim();
}

// 기존 기능과 동일한 익명 입력 처리
function isAnonymous(value) {
    return (
        value === true ||
        value === 1 ||
        value === "true" ||
        value === "1"
    );
}

// 댓글·답글 등록
// 답글에도 다시 답글을 달 수 있다.
// parent_id에는 직접 답변한 댓글 번호를 저장한다.
router.post("/", session, requireUser, async (req, res) => {
    let connection = null;

    try {
        const body = req.body || {};
        const user = req.communityUser;

        const postId = positiveId(body.postId, "게시글 번호");

        const parentId =
            body.parentId == null
                ? null
                : positiveId(body.parentId, "답글 대상 번호");

        const content = commentText(body.content);
        const anonymous = isAnonymous(body.isAnonymous);

        // 기존 첨부파일 검증 기능 재사용
        // 파일 개수·크기·이름·내용 형식을 검사한다.
        const files = decodeFiles(body.files);

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 기존 댓글 처리와 동일하게 게시글을 먼저 잠근다.
        const [posts] = await connection.query(
            `SELECT id, author_id
             FROM community_post
             WHERE id = ?
             FOR UPDATE`,
            [postId]
        );

        if (posts.length === 0) {
            fail(404, "게시글이 없습니다.");
        }

        let parentAuthorId = null;

        if (parentId !== null) {
            const [parents] = await connection.query(
                `SELECT id, author_id, is_deleted
                 FROM community_comment
                 WHERE id = ?
                   AND post_id = ?`,
                [parentId, postId]
            );

            if (
                parents.length === 0 ||
                Number(parents[0].is_deleted) === 1
            ) {
                fail(404, "답글 대상 댓글이 없거나 삭제되었습니다.");
            }

            // 원댓글과 답글 모두 답변 대상으로 허용
            parentAuthorId = parents[0].author_id;
        }

        // 기존 게시글별 익명 번호 체계를 그대로 사용
        const anonymousNumber = anonymous
            ? await numberFor(connection, postId, user.id)
            : null;

        const [saved] = await connection.query(
            `INSERT INTO community_comment (
                post_id,
                author_id,
                content,
                parent_id,
                is_anonymous
             )
             VALUES (?, ?, ?, ?, ?)`,
            [
                postId,
                user.id,
                content,
                parentId,
                anonymous ? 1 : 0
            ]
        );

        // 댓글과 첨부파일을 함께 저장
        for (const file of files) {
            await connection.query(
                `INSERT INTO community_attachment (
                    post_id,
                    comment_id,
                    original_name,
                    mime_type,
                    file_size,
                    file_data
                 )
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    postId,
                    saved.insertId,
                    file.name,
                    file.mime,
                    file.size,
                    file.data
                ]
            );
        }

        await connection.commit();
        connection.release();
        connection = null;

        // 게시글 작성자와 직접 답변한 댓글 작성자에게 알림
        // 본인은 제외하고 같은 사람에게는 한 번만 보낸다.
        const recipients = new Set(
            [posts[0].author_id, parentAuthorId]
                .filter(id =>
                    id != null &&
                    String(id) !== String(user.id)
                )
                .map(String)
        );

        const writerName = anonymous
            ? `익명${anonymousNumber}`
            : user.name;

        for (const recipientId of recipients) {
            try {
                await createNotification(
                    recipientId,
                    "커뮤니티",
                    `${writerName}님이 댓글을 남겼어요.`,
                    `/community/post/${postId}`
                );
            } catch (notificationError) {
                // 알림 실패로 저장된 댓글을 실패 처리하지 않는다.
                console.error(
                    "댓글 알림 실패:",
                    notificationError.code ||
                    notificationError.message
                );
            }
        }

        return res.status(201).json({
            id: saved.insertId,
            message:
                parentId === null
                    ? "댓글이 등록되었습니다."
                    : "답글이 등록되었습니다."
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "댓글 저장 취소 실패:",
                    rollbackError.code ||
                    rollbackError.message
                );
            }
        }

        console.error(
            "댓글 등록 실패:",
            error.code || error.message
        );

        return res.status(error.status || 500).json({
            message: error.status
                ? error.message
                : "댓글을 등록하지 못했습니다."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// 조회·수정·삭제는 기존 기능 사용
// 익명 이름 표시, 첨부파일 조회·수정·삭제도 그대로 유지한다.
// POST /는 위에서 응답하므로 기존 등록 처리까지 내려가지 않는다.
router.use(existingComments);

module.exports = router;