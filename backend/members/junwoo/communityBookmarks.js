const express = require("express");
const db = require("../../db");

const {
    session,
    requireUser
} = require("../dong/communitySession");

const router = express.Router();

// 아래 모든 요청은 로그인한 직원만 처리
router.use(session, requireUser);

// 특정 게시글을 내가 북마크했는지 조회
router.get("/", async function (req, res) {
    const postId = Number(req.query.postId);
    const employeeId = Number(req.communityUser.id);

    // 게시글 번호 검사
    if (!Number.isSafeInteger(postId) || postId < 1) {
        return res.status(400).json({
            message: "게시글 번호를 확인해주세요."
        });
    }

    // 직원 번호 검사
    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
        return res.status(400).json({
            message: "직원 정보를 확인해주세요."
        });
    }

    try {
        // 게시글이 실제로 존재하는지 확인
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

        // 해당 직원이 저장한 북마크 조회
        const [bookmarks] = await db.query(
            `SELECT id
             FROM community_bookmark
             WHERE post_id = ?
               AND author_id = ?
             LIMIT 1`,
            [postId, String(employeeId)]
        );

        res.json({
            bookmarked: bookmarks.length > 0
        });
    } catch (error) {
        console.error("북마크 조회 오류:", error);

        res.status(500).json({
            message: "북마크 정보를 불러오지 못했습니다."
        });
    }
});

// 북마크 등록
router.post("/", async function (req, res) {
    const body = req.body || {};

    const postId = Number(body.postId);
    const employeeId = Number(req.communityUser.id);

    // 게시글·직원 번호 검사
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
        // 게시글 존재 확인
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

        // 실제 재직 직원인지 확인
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

        // author_id에는 북마크한 직원 번호를 문자열로 저장
        await db.query(
            `INSERT INTO community_bookmark (
                post_id,
                author_id
             )
             VALUES (?, ?)`,
            [postId, String(employeeId)]
        );

        res.status(201).json({
            message: "북마크에 저장했습니다.",
            bookmarked: true
        });
    } catch (error) {
        // 이미 저장한 글이면 정상 처리
        if (error.code === "ER_DUP_ENTRY") {
            return res.json({
                message: "이미 북마크한 게시글입니다.",
                bookmarked: true
            });
        }

        // 확인한 직후 게시글이 삭제된 경우
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({
                message: "게시글이 더 이상 존재하지 않습니다."
            });
        }

        console.error("북마크 등록 오류:", error);

        res.status(500).json({
            message: "북마크 저장에 실패했습니다."
        });
    }
});

// 북마크 취소
router.delete("/", async function (req, res) {
    const body = req.body || {};

    const postId = Number(body.postId);
    const employeeId = Number(req.communityUser.id);

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
        // 해당 직원이 저장한 해당 글의 북마크만 삭제
        await db.query(
            `DELETE FROM community_bookmark
             WHERE post_id = ?
               AND author_id = ?`,
            [postId, String(employeeId)]
        );

        // 이미 취소된 상태여도 정상 응답
        res.json({
            message: "북마크를 취소했습니다.",
            bookmarked: false
        });
    } catch (error) {
        console.error("북마크 취소 오류:", error);

        res.status(500).json({
            message: "북마크 취소에 실패했습니다."
        });
    }
});

// 내가 북마크한 게시글 목록
router.get("/mine", async function (req, res) {
    const employeeId = Number(req.communityUser.id);

    if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
        return res.status(400).json({
            message: "직원 정보를 확인해주세요."
        });
    }

    try {
        const [bookmarks] = await db.query(
            `SELECT
                b.id AS bookmarkId,
                b.created_at AS bookmarkedAt,
                p.id AS postId,
                p.title,
                p.board_name AS boardName,
                COALESCE(
                    CASE
            WHEN p.is_anonymous = 1
            THEN CONCAT('익명', COALESCE(a.anonymous_number, ''))
            ELSE COALESCE(e.employee_name, '작성자 미등록')
            END AS authorName
             FROM community_bookmark b
             JOIN community_post p
                ON b.post_id = p.id
             LEFT JOIN employees e
                ON p.author_id = e.employee_id
             LEFT JOIN community_anonymous a
                ON a.post_id = p.id AND a.employee_id = p.author_id
             WHERE b.author_id = ?
             ORDER BY b.created_at DESC, b.id DESC`,
            [String(employeeId)]
        );

        res.json(bookmarks);
    } catch (error) {
        console.error("내 북마크 조회 오류:", error);

        res.status(500).json({
            message: "저장한 글을 불러오지 못했습니다."
        });
    }
});

module.exports = router;