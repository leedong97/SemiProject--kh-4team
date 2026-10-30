const express = require("express");
const db = require("../../db");

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
                c.content,
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
// 댓글 등록
// ===================================

router.post("/", async function (req, res) {
    const postId = Number(req.body.postId);
    const authorId = Number(req.body.authorId);
    const content = req.body.content;

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
        typeof content !== "string" ||
        content.trim() === "" ||
        content.trim().length > 1000
    ) {
        return res.status(400).json({
            message: "댓글은 1~1000자로 입력해주세요."
        });
    }

    try {
        // 게시글이 존재하는지 확인
        const [posts] = await db.query(
            `SELECT id
             FROM community_post
             WHERE id = ?`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: "게시글이 존재하지 않습니다."
            });
        }

        // 작성자가 등록된 재직 직원인지 확인
        const [employees] = await db.query(
            `SELECT employee_id
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

        // 댓글 저장
        const [result] = await db.query(
            `INSERT INTO community_comment (
                post_id,
                author_id,
                content
             )
             VALUES (?, ?, ?)`,
            [
                postId,
                authorId,
                content.trim()
            ]
        );

        res.status(201).json({
            message: "댓글이 등록되었습니다.",
            id: result.insertId
        });
    } catch (error) {
        // 확인 후 등록하기 직전에 게시글이 삭제된 경우
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({
                message: "게시글이 더 이상 존재하지 않습니다."
            });
        }

        console.error("댓글 등록 오류:", error);

        res.status(500).json({
            message: "댓글 등록에 실패했습니다."
        });
    }
});

// ===================================
// 댓글 삭제
// ===================================

router.delete("/:id", async function (req, res) {
    const id = Number(req.params.id);
    const authorId = Number(req.body.authorId);

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
            `DELETE FROM community_comment
             WHERE id = ?
               AND author_id = ?`,
            [id, authorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "삭제할 댓글이 없거나 작성자가 일치하지 않습니다."
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