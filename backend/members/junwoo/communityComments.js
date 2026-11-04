const express = require("express");
const db = require("../../db");
const { createNotification } = require("../../notify");

const router = express.Router();

// ===================================
// 특정 게시글의 댓글 조회
// ===================================

router.get("/", async function (req, res) {
    const postId = Number(req.query.postId);

    if (!Number.isSafeInteger(postId) || postId < 1) {
        return res.status(400).json({
            message: "게시글 번호를 확인해주세요."
        });
    }

    try {
        const [comments] = await db.query(
            `SELECT
                c.id,
                c.post_id AS postId,
                c.author_id AS authorId,
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                c.parent_id AS parentId,
                c.is_deleted AS isDeleted,
                CASE
            WHEN c.is_deleted = 1 THEN '삭제된 댓글입니다.'
            ELSE c.content
            END AS content,
                c.created_at AS createdAt,
                c.updated_at AS updatedAt
             FROM community_comment c
             LEFT JOIN employees e
                ON c.author_id = e.employee_id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC, c.id ASC`,
            [postId]
        );

        res.json(comments);
    } catch (error) {
        console.error("댓글 조회 오류:", error);

        res.status(500).json({
            message: "댓글을 불러오지 못했습니다."
        });
    }
});

// ===================================
// 댓글 · 답글 등록
// ===================================

router.post("/", async function (req, res) {
    const body = req.body || {};

    const postId = Number(body.postId);
    const authorId = Number(body.authorId);
    const content = body.content;

    // 일반 댓글은 null, 답글은 원래 댓글 번호
    const parentId =
        body.parentId == null
            ? null
            : Number(body.parentId);

    if (
        !Number.isSafeInteger(postId) ||
        postId < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 작성자 정보를 확인해주세요."
        });
    }

    if (
        parentId !== null &&
        (
            !Number.isSafeInteger(parentId) ||
            parentId < 1
        )
    ) {
        return res.status(400).json({
            message: "답글을 작성할 댓글 번호를 확인해주세요."
        });
    }

    if (
        typeof content !== "string" ||
        content.trim() === "" ||
        content.trim().length > 1000
    ) {
        return res.status(400).json({
            message: "댓글과 답글은 1~1000자로 입력해주세요."
        });
    }

    try {
        // 게시글 확인
        const [posts] = await db.query(
            `SELECT id, title, author_id
             FROM community_post
             WHERE id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: "게시글이 존재하지 않습니다."
            });
        }

        // 작성자 확인
        const [employees] = await db.query(
            `SELECT employee_id, employee_name
             FROM employees
             WHERE employee_id = ?
               AND employee_status = '재직'`,
            [authorId]
        );

        if (employees.length === 0) {
            return res.status(400).json({
                message: "작성자 정보를 확인해주세요."
            });
        }

        // 답글이면 원래 댓글 확인
        let parentAuthorId = null;

        if (parentId !== null) {
            const [parents] = await db.query(
                `SELECT id, parent_id, author_id
                 FROM community_comment
                 WHERE id = ?
                   AND post_id = ?`,
                [parentId, postId]
            );

            if (parents.length === 0) {
                return res.status(404).json({
                    message: "답글을 작성할 댓글이 없습니다."
                });
            }

            // 답글에 다시 답글을 다는 것은 제한
            if (parents[0].parent_id !== null) {
                return res.status(400).json({
                    message: "답글에는 다시 답글을 작성할 수 없습니다."
                });
            }

            parentAuthorId = parents[0].author_id;
        }

        // 일반 댓글과 답글 모두 같은 테이블에 저장
        const [result] = await db.query(
            `INSERT INTO community_comment (
                post_id,
                author_id,
                content,
                parent_id
             )
             VALUES (?, ?, ?, ?)`,
            [
                postId,
                authorId,
                content.trim(),
                parentId
            ]
        );

        // 알림: 답글이면 원래 댓글 쓴 사람에게, 글쓴이에게도 보낸다 (본인 제외, 같은 사람에게 중복 없음)
        const post = posts[0];
        const writerName = employees[0].employee_name;
        const link = "/community/post/" + postId;
        const alreadyNotified = String(authorId);

        if (
            parentAuthorId !== null &&
            String(parentAuthorId) !== String(authorId)
        ) {
            await createNotification(
                parentAuthorId,
                "커뮤니티",
                writerName + "님이 내 댓글에 답글을 남겼어요.",
                link
            );
        }

        if (
            String(post.author_id) !== alreadyNotified &&
            String(post.author_id) !== String(parentAuthorId)
        ) {
            await createNotification(
                post.author_id,
                "커뮤니티",
                writerName + "님이 내 글 \"" + post.title + "\"에 댓글을 남겼어요.",
                link
            );
        }

        res.status(201).json({
            message:
                parentId === null
                    ? "댓글이 등록되었습니다."
                    : "답글이 등록되었습니다.",
            id: result.insertId
        });
    } catch (error) {
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({
                message: "게시글 또는 원래 댓글이 존재하지 않습니다."
            });
        }

        console.error("댓글·답글 등록 오류:", error);

        res.status(500).json({
            message: "댓글·답글 등록에 실패했습니다."
        });
    }
});

// ===================================
// 댓글 · 답글 수정
// ===================================

router.put("/:id", async function (req, res) {
    const body = req.body || {};

    // 수정할 댓글 번호
    const id = Number(req.params.id);

    // 요청에서 전달받은 작성자 번호
    const authorId = Number(body.authorId);

    // 변경할 내용
    const content = body.content;

    // 댓글 번호와 작성자 번호 검사
    if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "댓글 또는 작성자 정보를 확인해주세요."
        });
    }

    // 내용 검사
    if (
        typeof content !== "string" ||
        content.trim() === "" ||
        content.trim().length > 1000
    ) {
        return res.status(400).json({
            message: "댓글과 답글은 1~1000자로 입력해주세요."
        });
    }

    try {
        const [result] = await db.query(
            `UPDATE community_comment
             SET content = ?
             WHERE id = ?
               AND author_id = ?
               AND is_deleted = 0`,
            [
                content.trim(),
                id,
                authorId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "댓글이 없거나 삭제되었거나 작성자가 일치하지 않습니다."
            });
        }

        res.json({
            message: "수정되었습니다."
        });
    } catch (error) {
        console.error("댓글·답글 수정 오류:", error);

        res.status(500).json({
            message: "댓글·답글 수정에 실패했습니다."
        });
    }
});

// ===================================
// 댓글 · 답글 삭제
// ===================================

router.delete("/:id", async function (req, res) {
    const id = Number(req.params.id);
    const authorId = Number((req.body || {}).authorId);

    if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "댓글 또는 작성자 정보를 확인해주세요."
        });
    }

    try {
        const [result] = await db.query(
            `UPDATE community_comment
             SET content = '',
                 is_deleted = 1
             WHERE id = ?
               AND author_id = ?
               AND is_deleted = 0`,
            [id, authorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    "삭제할 댓글이 없거나 이미 삭제되었거나 작성자가 일치하지 않습니다."
            });
        }

        res.json({
            message: "댓글이 삭제되었습니다."
        });
    } catch (error) {
        console.error("댓글 삭제 오류:", error);

        res.status(500).json({
            message: "댓글 삭제에 실패했습니다."
        });
    }
});

// 내가 작성한 댓글 조회
router.get("/mine", async function (req, res) {
    const authorId = Number(req.query.authorId);

    if (!Number.isSafeInteger(authorId) || authorId < 1) {
        return res.status(400).json({
            message: "작성자 정보를 확인해주세요."
        });
    }

    try {
        const [comments] = await db.query(
            `SELECT
                c.id,
                c.post_id AS postId,
                c.content,
                c.created_at AS createdAt,
                p.title AS postTitle,
                p.board_name AS boardName
             FROM community_comment c
             JOIN community_post p
                ON c.post_id = p.id
             WHERE c.author_id = ?
            AND c.is_deleted = 0
            ORDER BY c.created_at DESC, c.id DESC`,
            [authorId]
        );

        res.json(comments);
    } catch (error) {
        console.error("내 댓글 조회 오류:", error);

        res.status(500).json({
            message: "내 댓글을 불러오지 못했습니다."
        });
    }
});

module.exports = router;