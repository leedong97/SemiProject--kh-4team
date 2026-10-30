const express = require("express");
const db = require("../../db");

const router = express.Router();

// ===================================
// 좋아요 개수 + 내가 눌렀는지 조회
// ===================================

router.get("/", async function (req, res) {
    const postId = Number(req.query.postId);

    // 로그인 정보가 없으면 0으로 조회
    let employeeId = 0;

    if (req.query.employeeId !== undefined) {
        employeeId = Number(req.query.employeeId);

        if (
            !Number.isSafeInteger(employeeId) ||
            employeeId < 1
        ) {
            return res.status(400).json({
                message: "직원 정보를 확인해주세요."
            });
        }
    }

    if (!Number.isSafeInteger(postId) || postId < 1) {
        return res.status(400).json({
            message: "게시글 번호를 확인해주세요."
        });
    }

    try {
        const [posts] = await db.query(
            "SELECT id FROM community_post WHERE id = ?",
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: "게시글이 존재하지 않습니다."
            });
        }

        const [rows] = await db.query(
            `SELECT
                COUNT(*) AS likeCount,
                COUNT(
                    CASE
                        WHEN employee_id = ? THEN 1
                    END
                ) AS myLikeCount
             FROM community_like
             WHERE post_id = ?`,
            [employeeId, postId]
        );

        let liked = false;

        if (Number(rows[0].myLikeCount) > 0) {
            liked = true;
        }

        res.json({
            likeCount: Number(rows[0].likeCount),
            liked: liked
        });
    } catch (error) {
        console.error("좋아요 조회 오류:", error);

        res.status(500).json({
            message: "좋아요 정보를 불러오지 못했습니다."
        });
    }
});

// ===================================
// 좋아요 등록
// ===================================

router.post("/", async function (req, res) {
    const postId = Number(req.body.postId);
    const employeeId = Number(req.body.employeeId);

    if (
        !Number.isSafeInteger(postId) ||
        postId < 1 ||
        !Number.isSafeInteger(employeeId) ||
        employeeId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 직원 정보를 확인해주세요."
        });
    }

    try {
        const [posts] = await db.query(
            "SELECT id FROM community_post WHERE id = ?",
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                message: "게시글이 존재하지 않습니다."
            });
        }

        // 등록된 재직 직원인지 확인
        const [employees] = await db.query(
            `SELECT employee_id
             FROM employees
             WHERE employee_id = ?
               AND employee_status = '재직'`,
            [employeeId]
        );

        if (employees.length === 0) {
            return res.status(400).json({
                message: "직원 정보를 확인해주세요."
            });
        }

        await db.query(
            `INSERT INTO community_like (
                post_id,
                employee_id
             )
             VALUES (?, ?)`,
            [postId, employeeId]
        );

        res.status(201).json({
            message: "좋아요를 등록했습니다."
        });
    } catch (error) {
        // 이미 좋아요를 누른 상태면 그대로 유지
        if (error.code === "ER_DUP_ENTRY") {
            return res.json({
                message: "이미 좋아요를 누른 게시글입니다."
            });
        }

        // 확인 직후 원본 게시글이 삭제된 경우
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({
                message: "게시글이 더 이상 존재하지 않습니다."
            });
        }

        console.error("좋아요 등록 오류:", error);

        res.status(500).json({
            message: "좋아요 등록에 실패했습니다."
        });
    }
});

// ===================================
// 좋아요 취소
// ===================================

router.delete("/", async function (req, res) {
    const postId = Number(req.body.postId);
    const employeeId = Number(req.body.employeeId);

    if (
        !Number.isSafeInteger(postId) ||
        postId < 1 ||
        !Number.isSafeInteger(employeeId) ||
        employeeId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 직원 정보를 확인해주세요."
        });
    }

    try {
        await db.query(
            `DELETE FROM community_like
             WHERE post_id = ?
               AND employee_id = ?`,
            [postId, employeeId]
        );

        // 이미 취소된 상태여도 정상 응답
        res.json({
            message: "좋아요를 취소했습니다."
        });
    } catch (error) {
        console.error("좋아요 취소 오류:", error);

        res.status(500).json({
            message: "좋아요 취소에 실패했습니다."
        });
    }
});

module.exports = router;